import { KMSClient, DecryptCommand, DecryptCommandInput } from '@aws-sdk/client-kms';
import { SSMClient, PutParameterCommand, DeleteParameterCommand, PutParameterCommandInput } from '@aws-sdk/client-ssm';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';

const kms = new KMSClient({ region: process.env.AWS_REGION });
const ssm = new SSMClient({ region: process.env.AWS_REGION });

export interface SecureStringParameterResourceProperties {
  readonly AllowedPattern?: string;
  readonly Description?: string;
  readonly EncryptionKey?: string;
  readonly Name: string;
  readonly Tier?: string;
  readonly Value: string;
  readonly ValueType: string;
}

export type SecureStringCustomResourceEvent = Omit<CloudFormationCustomResourceEvent, 'ResourceProperties'> & {
  ResourceProperties: SecureStringParameterResourceProperties;
}

export interface CustomResourceResponse {
  PhysicalResourceId: string;
}

export function handler(event: SecureStringCustomResourceEvent): Promise<CustomResourceResponse> {
  console.debug(JSON.stringify(event));
  switch (event.RequestType) {
    case 'Create':
      return onCreateAndUpdate(event);
    case 'Update':
      return onCreateAndUpdate(event);
    case 'Delete':
      return onDelete(event);
    default:
      throw new Error(`Unknown RequestType: ${event.RequestType}`);
  }
}

async function onCreateAndUpdate(event: SecureStringCustomResourceEvent): Promise<CustomResourceResponse> {
  const { AllowedPattern, Description, Name, Tier, EncryptionKey, Value, ValueType } = event.ResourceProperties;
  const decryptedValue = ValueType === 'encrypted' ? await decrypt(Value, EncryptionKey) : Value;
  const params: PutParameterCommandInput = {
    AllowedPattern,
    Description,
    Name,
    KeyId: EncryptionKey,
    Overwrite: true,
    Tier,
    Type: 'SecureString',
    Value: decryptedValue,
  };
  await ssm.send(new PutParameterCommand(params));
  return {
    PhysicalResourceId: Name,
  };
}

async function onDelete(event: SecureStringCustomResourceEvent): Promise<CustomResourceResponse> {
  const { Name } = event.ResourceProperties;
  const params = {
    Name,
  };
  await ssm.send(new DeleteParameterCommand(params));
  return {
    PhysicalResourceId: Name,
  };
}

async function decrypt(value: string, key: string | undefined): Promise<string> {
  const params: DecryptCommandInput = {
    CiphertextBlob: Buffer.from(value, 'base64'),
    KeyId: key, // AWS can infer the key from value if no key is given, but this function requires permissions to decrypt
  };
  const { Plaintext } = await kms.send(new DecryptCommand(params));
  if (Plaintext === undefined) throw new Error('Unable to decrypt');
  return Buffer.from(Plaintext).toString('utf-8');
}