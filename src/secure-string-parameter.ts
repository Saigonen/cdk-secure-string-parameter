import { CustomResource, RemovalPolicy, Resource, Stack } from 'aws-cdk-lib';
import { Effect, Grant, IGrantable, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Alias, IAlias, IKey, Key } from 'aws-cdk-lib/aws-kms';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { IStringParameter, ParameterDataType, ParameterOptions, ParameterType, StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Provider } from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import * as uuid from 'uuid';
import { SecureStringParameterHandlerFunction } from './lambda/secure-string-parameter-handler-function';
import { arnForParameterName } from './util';

/**
 * The type of the stringValue.
 */
export enum ValueType {
  /**
   * Indicates that the value of this parameter is in plain text.
   */
  PLAINTEXT = 'plaintext',
  /**
   * Indicates that the value of this parameter is encrypted with a kms key.
   */
  ENCRYPTED = 'encrypted'
}

export interface SecureStringParameterResourceProperties {
  readonly parameterName: string;
  readonly stringValue: string;
  readonly allowedPattern?: string;
  readonly description?: string;
  readonly tier?: string;
  readonly encryptionKey?: string;
  readonly valueType: ValueType;
}

export interface BaseProps extends ParameterOptions {
  /**
   * The value of the parameter. It may not reference another parameter and ``{{}}`` cannot be used in the value.
   */
  readonly stringValue: string;
  /**
   * The data type of the parameter value. Only `text` is allowed.
   * @default ParameterDataType.TEXT
   */
  readonly dataType?: ParameterDataType.TEXT;
  /**
   * The type of the parameter. Only `SecureString` is allowed.
   * @default ParameterType.SECURE_STRING
   */
  readonly type?: ParameterType.SECURE_STRING;
  /**
   * Policy to apply when the parameter is removed from this stack.
   * @default RemovalPolicy.DESTROY
   */
  readonly removalPolicy?: RemovalPolicy;
}

export interface EncryptedSecureStringParameterProps extends BaseProps {
  /**
   * The encryption key that is used to encrypt this parameter.
   * */
  readonly encryptionKey: IKey;
  /**
   * The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key.
   *
   * **WARNING:** If you use `plaintext`, the unecrypted value of the parameter is visible to anyone who has access to cloudformation or deploy artifacts.
   */
  readonly valueType: ValueType.ENCRYPTED;
}

export interface PlainTextSecureStringParameterProps extends BaseProps {
  /**
   * The encryption key that is used to encrypt this parameter.
   * @default alias/aws/ssm
   * */
  readonly encryptionKey?: IKey;
  /**
   * The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key.
   *
   * **WARNING:** If you use `plaintext`, the unecrypted value of the parameter is visible to anyone who has access to cloudformation or deploy artifacts.
   */
  readonly valueType: ValueType.PLAINTEXT;
}

export type SecureStringParameterProps = EncryptedSecureStringParameterProps | PlainTextSecureStringParameterProps

/**
 * Creates a new SecureString SSM Parameter.
 *
 * If the valueType property is set to `encrypted`, the actual ssm securestring parameter will be created with a decrypted value from the stringValue property.
 * @resource Custom::SecureStringParameter
 */
export class SecureStringParameter extends Resource implements IStringParameter {
  readonly parameterArn: string;
  readonly parameterName: string;
  readonly parameterType: string;
  readonly stringValue: string;
  /**
   * The encryption key that is used to encrypt this parameter.
   *
   * @attribute
   */
  readonly encryptionKey?: IKey;
  /**
   * The type of the stringValue.
   */
  readonly valueType: ValueType;
  private readonly eventHandler: IFunction;
  private readonly provider: Provider;
  private stringParameter?: IStringParameter;

  constructor(scope: Construct, id: string, props: SecureStringParameterProps) {
    super(scope, id);

    this.valueType = props.valueType;
    this.encryptionKey = props.encryptionKey;
    this.stringValue = props.stringValue;
    this.parameterType = ParameterType.SECURE_STRING;
    this.parameterName = props.parameterName ?? uuid.v4();
    this.parameterArn = arnForParameterName(this, this.parameterName, { simpleName: props.simpleName });

    this.eventHandler = this.getOrCreateHandler();

    if (this.encryptionKey) {
      const isIAlias = (key: IKey): key is IAlias => 'aliasTargetKey' in key;
      const isAlias = (key: IKey): key is Alias => key instanceof Alias;
      const getKey = (key: IKey): IKey => {
        if (isAlias(key)) return key.aliasTargetKey;
        if (isIAlias(key)) return Key.fromLookup(this, 'key', { aliasName: key.aliasName });
        return key;
      };
      const key = getKey(this.encryptionKey);
      this.eventHandler.addToRolePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          resources: [key.keyArn],
          actions: ['kms:Decrypt', 'kms:Encrypt'],
        }),
      );
    }

    this.provider = this.getOrCreateProvider();

    const properties: SecureStringParameterResourceProperties = {
      parameterName: this.parameterName,
      stringValue: this.stringValue,
      allowedPattern: props.allowedPattern,
      description: props.description,
      tier: props.tier,
      encryptionKey: this.encryptionKey?.keyId,
      valueType: props.valueType,
    };

    new CustomResource(this, id, {
      serviceToken: this.provider.serviceToken,
      resourceType: 'Custom::SecureStringParameter',
      removalPolicy: props.removalPolicy,
      properties,
    });
  }

  grantRead(grantee: IGrantable): Grant {
    return this.asStringParameter().grantRead(grantee);
  }

  grantWrite(grantee: IGrantable): Grant {
    return this.asStringParameter().grantWrite(grantee);
  }

  /**
   * Returns this parameter as a native StringParameter.
   */
  asStringParameter(): IStringParameter {
    if (!this.stringParameter) {
      this.stringParameter = StringParameter.fromSecureStringParameterAttributes(this, 'StringParameter', {
        parameterName: this.parameterName,
      });
    }
    return this.stringParameter;
  }

  private getOrCreateHandler(): IFunction {
    const id = 'SecureStringParameterCustomResourceHandler';
    const stack = Stack.of(this);
    const existing = stack.node.tryFindChild(id);
    if (existing) return existing as IFunction;
    const eventHandler = new SecureStringParameterHandlerFunction(stack, id, {
      initialPolicy: [new PolicyStatement({
        effect: Effect.ALLOW,
        resources: ['*'], // Must allow * to handle parameter name changes
        actions: ['ssm:PutParameter', 'ssm:DeleteParameter'],
      })],
      logRetention: RetentionDays.ONE_WEEK,
    });
    return eventHandler;
  }

  private getOrCreateProvider(): Provider {
    const id = 'SecureStringParameterCustomResourceProvider';
    const stack = Stack.of(this);
    const existing = stack.node.tryFindChild(id);
    if (existing) return existing as Provider;
    const provider = new Provider(stack, id, {
      onEventHandler: this.eventHandler,
      logRetention: RetentionDays.ONE_WEEK,
    });
    return provider;
  }
}
