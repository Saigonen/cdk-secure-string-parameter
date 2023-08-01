# cdk-secure-string-parameter

[![source](https://img.shields.io/badge/source-github-blue?logo=github)](https://github.com/saigonen/cdk-secure-string-parameter)
[![npm release](https://img.shields.io/npm/v/cdk-secure-string-parameter?label=npm)](https://www.npmjs.com/package/cdk-secure-string-parameter)
![cdk peer dependency version](https://img.shields.io/npm/dependency-version/cdk-secure-string-parameter/peer/aws-cdk-lib?label=cdk)
![npm downloads](https://img.shields.io/npm/dt/cdk-secure-string-parameter)

CDK Custom Construct that enables you to create SSM SecureString Parameters from KMS encrypted secrets that you can commit to your repository.

## Installation

Install with your preferred package manager

```bash
npm install cdk-secure-string-parameter --save-dev
```

## Usage

```ts
import { Stack } from 'aws-cdk-lib';
import { Alias } from 'aws-cdk-lib/aws-kms';
import { SecureStringParameter, ValueType } from 'cdk-secure-string-parameter';

const stack = new Stack();

new SecureStringParameter(stack, 'MyParameter', {
  parameterName: '/test/item',
  stringValue: 'AQICAHg6JhQE8cNQ3gqb+2FF1N1k3o6xrTdYU0c2...J5GCTtehNspP0EtatC6Vg==',
  valueType: ValueType.ENCRYPTED,
  encryptionKey: Alias.fromAliasName(stack, 'CustomKey', 'alias/custom'),
});
```

`SecureStringParameter` implements `IStringParameter` so you can use it as you would a native cdk `StringParameter`.

### *ValueType*

The extra parameter `valueType` is used to describe the type of the `stringValue`.

```ts
enum ValueType {
  ENCRYPTED = 'encrypted',
  PLAINTEXT = 'plaintext'
}
```

If your value is encrypted with a KMS key you must also provide the corresponding key in the `encryptionKey` parameter. This same key will be used in the generated SSM Parameter. If you use a plaintext value, the `encryptionKey` is optional and the Parameter can be created using the default SSM key `/alias/aws/ssm`.

```ts
new SecureStringParameter(stack, 'MyParameter', {
  parameterName: '/test/item',
  stringValue: 'not a secret',
  valueType: ValueType.PLAINTEXT,
});
```

**WARNING** If you use a plaintext value, the value will be visible to anyone who has access to cloudformation or deploy artifacts.

### *Tags*

Default Cloudformation Stack tags are not supported. This is because resources created with Custom Resources framework can not be tagged with AWS managed tags.
However, you can add custom tags to your stack, and they are propagated properly to the generated SSM Parameters.

## Creating encrypted secrets

To store encrypted secrets in your repository you need to first create a custom KMS key. You can do it with aws-cli.

```bash
aws kms create-key
aws kms create-alias --target-key-id <key-id> --alias-name <alias-name>
```

Next you can encrypt your secrets and get a base64 formatted value which you can store in your repository.

```bash
aws kms encrypt --key-id <alias-name> --plaintext fileb://<(printf <your secret>) --query CiphertextBlob --output text
```

With this CDK Custom Construct you can then create SSM SecureString Parameters from these encrypted strings. The encrypted values are first decrypted inside a custom construct lambda and the decrypted value is used as input to the SSM Parameter. This way the plaintext value is never visible to those who don't have access to SSM.

# API Reference <a name="API Reference" id="api-reference"></a>

## Constructs <a name="Constructs" id="Constructs"></a>

### SecureStringParameter <a name="SecureStringParameter" id="cdk-secure-string-parameter.SecureStringParameter"></a>

- *Implements:* aws-cdk-lib.aws_ssm.IStringParameter, aws-cdk-lib.ITaggable

Creates a new SecureString SSM Parameter.

If the valueType property is set to `encrypted`, the actual SSM SecureString Parameter will be created with a decrypted value from the stringValue property.

#### Initializers <a name="Initializers" id="cdk-secure-string-parameter.SecureStringParameter.Initializer"></a>

```typescript
import { SecureStringParameter } from 'cdk-secure-string-parameter'

new SecureStringParameter(scope: Construct, id: string, props: EncryptedSecureStringParameterProps | PlainTextSecureStringParameterProps)
```

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.scope">scope</a></code> | <code>constructs.Construct</code> | *No description.* |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.id">id</a></code> | <code>string</code> | *No description.* |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.props">props</a></code> | <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps">EncryptedSecureStringParameterProps</a> \| <a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps">PlainTextSecureStringParameterProps</a></code> | *No description.* |

---

##### `scope`<sup>Required</sup> <a name="scope" id="cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.scope"></a>

- *Type:* constructs.Construct

---

##### `id`<sup>Required</sup> <a name="id" id="cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.id"></a>

- *Type:* string

---

##### `props`<sup>Required</sup> <a name="props" id="cdk-secure-string-parameter.SecureStringParameter.Initializer.parameter.props"></a>

- *Type:* <a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps">EncryptedSecureStringParameterProps</a> | <a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps">PlainTextSecureStringParameterProps</a>

---

#### Methods <a name="Methods" id="Methods"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.toString">toString</a></code> | Returns a string representation of this construct. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.applyRemovalPolicy">applyRemovalPolicy</a></code> | Apply the given removal policy to this resource. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.asStringParameter">asStringParameter</a></code> | Returns this parameter as a native StringParameter. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.grantRead">grantRead</a></code> | Grants read (DescribeParameter, GetParameter, GetParameterHistory) permissions on the SSM Parameter. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.grantWrite">grantWrite</a></code> | Grants write (PutParameter) permissions on the SSM Parameter. |

---

##### `toString` <a name="toString" id="cdk-secure-string-parameter.SecureStringParameter.toString"></a>

```typescript
public toString(): string
```

Returns a string representation of this construct.

##### `applyRemovalPolicy` <a name="applyRemovalPolicy" id="cdk-secure-string-parameter.SecureStringParameter.applyRemovalPolicy"></a>

```typescript
public applyRemovalPolicy(policy: RemovalPolicy): void
```

Apply the given removal policy to this resource.

The Removal Policy controls what happens to this resource when it stops
being managed by CloudFormation, either because you've removed it from the
CDK application or because you've made a change that requires the resource
to be replaced.

The resource can be deleted (`RemovalPolicy.DESTROY`), or left in your AWS
account for data recovery and cleanup later (`RemovalPolicy.RETAIN`).

###### `policy`<sup>Required</sup> <a name="policy" id="cdk-secure-string-parameter.SecureStringParameter.applyRemovalPolicy.parameter.policy"></a>

- *Type:* aws-cdk-lib.RemovalPolicy

---

##### `asStringParameter` <a name="asStringParameter" id="cdk-secure-string-parameter.SecureStringParameter.asStringParameter"></a>

```typescript
public asStringParameter(): IStringParameter
```

Returns this parameter as a native StringParameter.

##### `grantRead` <a name="grantRead" id="cdk-secure-string-parameter.SecureStringParameter.grantRead"></a>

```typescript
public grantRead(grantee: IGrantable): Grant
```

Grants read (DescribeParameter, GetParameter, GetParameterHistory) permissions on the SSM Parameter.

###### `grantee`<sup>Required</sup> <a name="grantee" id="cdk-secure-string-parameter.SecureStringParameter.grantRead.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

##### `grantWrite` <a name="grantWrite" id="cdk-secure-string-parameter.SecureStringParameter.grantWrite"></a>

```typescript
public grantWrite(grantee: IGrantable): Grant
```

Grants write (PutParameter) permissions on the SSM Parameter.

###### `grantee`<sup>Required</sup> <a name="grantee" id="cdk-secure-string-parameter.SecureStringParameter.grantWrite.parameter.grantee"></a>

- *Type:* aws-cdk-lib.aws_iam.IGrantable

---

#### Static Functions <a name="Static Functions" id="Static Functions"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.isConstruct">isConstruct</a></code> | Checks if `x` is a construct. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.isResource">isResource</a></code> | Check whether the given construct is a Resource. |

---

##### ~~`isConstruct`~~ <a name="isConstruct" id="cdk-secure-string-parameter.SecureStringParameter.isConstruct"></a>

```typescript
import { SecureStringParameter } from 'cdk-secure-string-parameter'

SecureStringParameter.isConstruct(x: any)
```

Checks if `x` is a construct.

###### `x`<sup>Required</sup> <a name="x" id="cdk-secure-string-parameter.SecureStringParameter.isConstruct.parameter.x"></a>

- *Type:* any

Any object.

---

##### `isResource` <a name="isResource" id="cdk-secure-string-parameter.SecureStringParameter.isResource"></a>

```typescript
import { SecureStringParameter } from 'cdk-secure-string-parameter'

SecureStringParameter.isResource(construct: IConstruct)
```

Check whether the given construct is a Resource.

###### `construct`<sup>Required</sup> <a name="construct" id="cdk-secure-string-parameter.SecureStringParameter.isResource.parameter.construct"></a>

- *Type:* constructs.IConstruct

---

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.node">node</a></code> | <code>constructs.Node</code> | The tree node. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.env">env</a></code> | <code>aws-cdk-lib.ResourceEnvironment</code> | The environment this resource belongs to. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.stack">stack</a></code> | <code>aws-cdk-lib.Stack</code> | The stack in which this resource is defined. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.parameterArn">parameterArn</a></code> | <code>string</code> | The ARN of the SSM Parameter resource. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.parameterName">parameterName</a></code> | <code>string</code> | The name of the SSM Parameter resource. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.parameterType">parameterType</a></code> | <code>string</code> | The type of the SSM Parameter resource. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.stringValue">stringValue</a></code> | <code>string</code> | The parameter value. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.tags">tags</a></code> | <code>aws-cdk-lib.TagManager</code> | TagManager to set, remove and format tags. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.valueType">valueType</a></code> | <code><a href="#cdk-secure-string-parameter.ValueType">ValueType</a></code> | The type of the stringValue. |
| <code><a href="#cdk-secure-string-parameter.SecureStringParameter.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The encryption key that is used to encrypt this parameter. |

---

##### `node`<sup>Required</sup> <a name="node" id="cdk-secure-string-parameter.SecureStringParameter.property.node"></a>

```typescript
public readonly node: Node;
```

- *Type:* constructs.Node

The tree node.

---

##### `env`<sup>Required</sup> <a name="env" id="cdk-secure-string-parameter.SecureStringParameter.property.env"></a>

```typescript
public readonly env: ResourceEnvironment;
```

- *Type:* aws-cdk-lib.ResourceEnvironment

The environment this resource belongs to.

For resources that are created and managed by the CDK
(generally, those created by creating new class instances like Role, Bucket, etc.),
this is always the same as the environment of the stack they belong to;
however, for imported resources
(those obtained from static methods like fromRoleArn, fromBucketName, etc.),
that might be different than the stack they were imported into.

---

##### `stack`<sup>Required</sup> <a name="stack" id="cdk-secure-string-parameter.SecureStringParameter.property.stack"></a>

```typescript
public readonly stack: Stack;
```

- *Type:* aws-cdk-lib.Stack

The stack in which this resource is defined.

---

##### `parameterArn`<sup>Required</sup> <a name="parameterArn" id="cdk-secure-string-parameter.SecureStringParameter.property.parameterArn"></a>

```typescript
public readonly parameterArn: string;
```

- *Type:* string

The ARN of the SSM Parameter resource.

---

##### `parameterName`<sup>Required</sup> <a name="parameterName" id="cdk-secure-string-parameter.SecureStringParameter.property.parameterName"></a>

```typescript
public readonly parameterName: string;
```

- *Type:* string

The name of the SSM Parameter resource.

---

##### `parameterType`<sup>Required</sup> <a name="parameterType" id="cdk-secure-string-parameter.SecureStringParameter.property.parameterType"></a>

```typescript
public readonly parameterType: string;
```

- *Type:* string

The type of the SSM Parameter resource.

---

##### `stringValue`<sup>Required</sup> <a name="stringValue" id="cdk-secure-string-parameter.SecureStringParameter.property.stringValue"></a>

```typescript
public readonly stringValue: string;
```

- *Type:* string

The parameter value.

Value must not nest another parameter. Do not use {{}} in the value.

---

##### `tags`<sup>Required</sup> <a name="tags" id="cdk-secure-string-parameter.SecureStringParameter.property.tags"></a>

```typescript
public readonly tags: TagManager;
```

- *Type:* aws-cdk-lib.TagManager

TagManager to set, remove and format tags.

---

##### `valueType`<sup>Required</sup> <a name="valueType" id="cdk-secure-string-parameter.SecureStringParameter.property.valueType"></a>

```typescript
public readonly valueType: ValueType;
```

- *Type:* <a href="#cdk-secure-string-parameter.ValueType">ValueType</a>

The type of the stringValue.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="cdk-secure-string-parameter.SecureStringParameter.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The encryption key that is used to encrypt this parameter.

---


## Structs <a name="Structs" id="Structs"></a>

### EncryptedSecureStringParameterProps <a name="EncryptedSecureStringParameterProps" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps"></a>

#### Initializer <a name="Initializer" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.Initializer"></a>

```typescript
import { EncryptedSecureStringParameterProps } from 'cdk-secure-string-parameter'

const encryptedSecureStringParameterProps: EncryptedSecureStringParameterProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.allowedPattern">allowedPattern</a></code> | <code>string</code> | A regular expression used to validate the parameter value. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.description">description</a></code> | <code>string</code> | Information about the parameter that you want to add to the system. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.parameterName">parameterName</a></code> | <code>string</code> | The name of the parameter. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.simpleName">simpleName</a></code> | <code>boolean</code> | Indicates of the parameter name is a simple name (i.e. does not include "/" separators). |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.tier">tier</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterTier</code> | The tier of the string parameter. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The encryption key that is used to encrypt this parameter. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.stringValue">stringValue</a></code> | <code>string</code> | The value of the parameter. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.valueType">valueType</a></code> | <code><a href="#cdk-secure-string-parameter.ValueType">ValueType</a></code> | The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.dataType">dataType</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterDataType</code> | The data type of the parameter value. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the parameter is removed from this stack. |
| <code><a href="#cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.type">type</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterType</code> | The type of the parameter. |

---

##### `allowedPattern`<sup>Optional</sup> <a name="allowedPattern" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.allowedPattern"></a>

```typescript
public readonly allowedPattern: string;
```

- *Type:* string
- *Default:* no validation is performed

A regular expression used to validate the parameter value.

For example, for String types with values restricted to
numbers, you can specify the following: ``^\d+$``

---

##### `description`<sup>Optional</sup> <a name="description" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* none

Information about the parameter that you want to add to the system.

---

##### `parameterName`<sup>Optional</sup> <a name="parameterName" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.parameterName"></a>

```typescript
public readonly parameterName: string;
```

- *Type:* string
- *Default:* a name will be generated by CloudFormation

The name of the parameter.

---

##### `simpleName`<sup>Optional</sup> <a name="simpleName" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.simpleName"></a>

```typescript
public readonly simpleName: boolean;
```

- *Type:* boolean
- *Default:* auto-detect based on `parameterName`

Indicates of the parameter name is a simple name (i.e. does not include "/" separators).

This is only required only if `parameterName` is a token, which means we
are unable to detect if the name is simple or "path-like" for the purpose
of rendering SSM parameter ARNs.

If `parameterName` is not specified, `simpleName` must be `true` (or
undefined) since the name generated by AWS CloudFormation is always a
simple name.

---

##### `tier`<sup>Optional</sup> <a name="tier" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.tier"></a>

```typescript
public readonly tier: ParameterTier;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterTier
- *Default:* undefined

The tier of the string parameter.

---

##### `encryptionKey`<sup>Required</sup> <a name="encryptionKey" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey

The encryption key that is used to encrypt this parameter.

---

##### `stringValue`<sup>Required</sup> <a name="stringValue" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.stringValue"></a>

```typescript
public readonly stringValue: string;
```

- *Type:* string

The value of the parameter.

It may not reference another parameter and ``{{}}`` cannot be used in the value.

---

##### `valueType`<sup>Required</sup> <a name="valueType" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.valueType"></a>

```typescript
public readonly valueType: ValueType;
```

- *Type:* <a href="#cdk-secure-string-parameter.ValueType">ValueType</a>

The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key.

**WARNING:** If you use `plaintext`, the unecrypted value of the parameter is visible to anyone who has access to cloudformation or deploy artifacts.

---

##### `dataType`<sup>Optional</sup> <a name="dataType" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.dataType"></a>

```typescript
public readonly dataType: ParameterDataType;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterDataType
- *Default:* ParameterDataType.TEXT

The data type of the parameter value.

Only `text` is allowed.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.DESTROY

Policy to apply when the parameter is removed from this stack.

---

##### `type`<sup>Optional</sup> <a name="type" id="cdk-secure-string-parameter.EncryptedSecureStringParameterProps.property.type"></a>

```typescript
public readonly type: ParameterType;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterType
- *Default:* ParameterType.SECURE_STRING

The type of the parameter.

Only `SecureString` is allowed.

---

### PlainTextSecureStringParameterProps <a name="PlainTextSecureStringParameterProps" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps"></a>

#### Initializer <a name="Initializer" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.Initializer"></a>

```typescript
import { PlainTextSecureStringParameterProps } from 'cdk-secure-string-parameter'

const plainTextSecureStringParameterProps: PlainTextSecureStringParameterProps = { ... }
```

#### Properties <a name="Properties" id="Properties"></a>

| **Name** | **Type** | **Description** |
| --- | --- | --- |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.allowedPattern">allowedPattern</a></code> | <code>string</code> | A regular expression used to validate the parameter value. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.description">description</a></code> | <code>string</code> | Information about the parameter that you want to add to the system. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.parameterName">parameterName</a></code> | <code>string</code> | The name of the parameter. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.simpleName">simpleName</a></code> | <code>boolean</code> | Indicates of the parameter name is a simple name (i.e. does not include "/" separators). |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.tier">tier</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterTier</code> | The tier of the string parameter. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.stringValue">stringValue</a></code> | <code>string</code> | The value of the parameter. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.valueType">valueType</a></code> | <code><a href="#cdk-secure-string-parameter.ValueType">ValueType</a></code> | The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.dataType">dataType</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterDataType</code> | The data type of the parameter value. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.encryptionKey">encryptionKey</a></code> | <code>aws-cdk-lib.aws_kms.IKey</code> | The encryption key that is used to encrypt this parameter. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.removalPolicy">removalPolicy</a></code> | <code>aws-cdk-lib.RemovalPolicy</code> | Policy to apply when the parameter is removed from this stack. |
| <code><a href="#cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.type">type</a></code> | <code>aws-cdk-lib.aws_ssm.ParameterType</code> | The type of the parameter. |

---

##### `allowedPattern`<sup>Optional</sup> <a name="allowedPattern" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.allowedPattern"></a>

```typescript
public readonly allowedPattern: string;
```

- *Type:* string
- *Default:* no validation is performed

A regular expression used to validate the parameter value.

For example, for String types with values restricted to
numbers, you can specify the following: ``^\d+$``

---

##### `description`<sup>Optional</sup> <a name="description" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.description"></a>

```typescript
public readonly description: string;
```

- *Type:* string
- *Default:* none

Information about the parameter that you want to add to the system.

---

##### `parameterName`<sup>Optional</sup> <a name="parameterName" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.parameterName"></a>

```typescript
public readonly parameterName: string;
```

- *Type:* string
- *Default:* a name will be generated by CloudFormation

The name of the parameter.

---

##### `simpleName`<sup>Optional</sup> <a name="simpleName" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.simpleName"></a>

```typescript
public readonly simpleName: boolean;
```

- *Type:* boolean
- *Default:* auto-detect based on `parameterName`

Indicates of the parameter name is a simple name (i.e. does not include "/" separators).

This is only required only if `parameterName` is a token, which means we
are unable to detect if the name is simple or "path-like" for the purpose
of rendering SSM parameter ARNs.

If `parameterName` is not specified, `simpleName` must be `true` (or
undefined) since the name generated by AWS CloudFormation is always a
simple name.

---

##### `tier`<sup>Optional</sup> <a name="tier" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.tier"></a>

```typescript
public readonly tier: ParameterTier;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterTier
- *Default:* undefined

The tier of the string parameter.

---

##### `stringValue`<sup>Required</sup> <a name="stringValue" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.stringValue"></a>

```typescript
public readonly stringValue: string;
```

- *Type:* string

The value of the parameter.

It may not reference another parameter and ``{{}}`` cannot be used in the value.

---

##### `valueType`<sup>Required</sup> <a name="valueType" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.valueType"></a>

```typescript
public readonly valueType: ValueType;
```

- *Type:* <a href="#cdk-secure-string-parameter.ValueType">ValueType</a>

The type of the stringValue. Use type `encrypted` if the value is encrypted with a kms key.

**WARNING:** If you use `plaintext`, the unecrypted value of the parameter is visible to anyone who has access to cloudformation or deploy artifacts.

---

##### `dataType`<sup>Optional</sup> <a name="dataType" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.dataType"></a>

```typescript
public readonly dataType: ParameterDataType;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterDataType
- *Default:* ParameterDataType.TEXT

The data type of the parameter value.

Only `text` is allowed.

---

##### `encryptionKey`<sup>Optional</sup> <a name="encryptionKey" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.encryptionKey"></a>

```typescript
public readonly encryptionKey: IKey;
```

- *Type:* aws-cdk-lib.aws_kms.IKey
- *Default:* alias/aws/ssm

The encryption key that is used to encrypt this parameter.

---

##### `removalPolicy`<sup>Optional</sup> <a name="removalPolicy" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.removalPolicy"></a>

```typescript
public readonly removalPolicy: RemovalPolicy;
```

- *Type:* aws-cdk-lib.RemovalPolicy
- *Default:* RemovalPolicy.DESTROY

Policy to apply when the parameter is removed from this stack.

---

##### `type`<sup>Optional</sup> <a name="type" id="cdk-secure-string-parameter.PlainTextSecureStringParameterProps.property.type"></a>

```typescript
public readonly type: ParameterType;
```

- *Type:* aws-cdk-lib.aws_ssm.ParameterType
- *Default:* ParameterType.SECURE_STRING

The type of the parameter.

Only `SecureString` is allowed.

---



## Enums <a name="Enums" id="Enums"></a>

### ValueType <a name="ValueType" id="cdk-secure-string-parameter.ValueType"></a>

The type of the stringValue.

#### Members <a name="Members" id="Members"></a>

| **Name** | **Description** |
| --- | --- |
| <code><a href="#cdk-secure-string-parameter.ValueType.ENCRYPTED">ENCRYPTED</a></code> | Indicates that the value of this parameter is encrypted with a kms key. |
| <code><a href="#cdk-secure-string-parameter.ValueType.PLAINTEXT">PLAINTEXT</a></code> | Indicates that the value of this parameter is in plain text. |

---

##### `ENCRYPTED` <a name="ENCRYPTED" id="cdk-secure-string-parameter.ValueType.ENCRYPTED"></a>

Indicates that the value of this parameter is encrypted with a kms key.

---


##### `PLAINTEXT` <a name="PLAINTEXT" id="cdk-secure-string-parameter.ValueType.PLAINTEXT"></a>

Indicates that the value of this parameter is in plain text.

---

