import { KMSClient, DecryptCommand, DecryptCommandInput } from '@aws-sdk/client-kms';
import { SSMClient, PutParameterCommand, DeleteParameterCommand, ListTagsForResourceCommand, RemoveTagsFromResourceCommand, AddTagsToResourceCommand, ParameterTier } from '@aws-sdk/client-ssm';
import type { CloudFormationCustomResourceEvent } from 'aws-lambda';

export interface SecureStringParameterResourceProperties {
  readonly AllowedPattern?: string;
  readonly Description?: string;
  readonly EncryptionKey?: string;
  readonly Name: string;
  readonly Tags?: Record<string, string>;
  readonly Tier?: ParameterTier;
  readonly Value: string;
  readonly ValueType: string;
}

export type SecureStringCustomResourceEvent = Omit<CloudFormationCustomResourceEvent, 'ResourceProperties'> & {
  ResourceProperties: SecureStringParameterResourceProperties;
};

export interface CustomResourceResponse {
  PhysicalResourceId: string;
}

const kms = new KMSClient({ region: process.env.AWS_REGION });
const ssm = new SSMClient({ region: process.env.AWS_REGION });

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
  const { AllowedPattern, Description, Name, Tags, Tier, EncryptionKey, Value, ValueType } = event.ResourceProperties;
  const decryptedValue = ValueType === 'encrypted' ? await decrypt(Value, EncryptionKey) : Value;
  await ssm.send(new PutParameterCommand({
    AllowedPattern,
    Description,
    Name,
    KeyId: EncryptionKey,
    Overwrite: true,
    Tier,
    Type: 'SecureString',
    Value: decryptedValue,
  }));
  await updateTags(Name, Tags);
  return {
    PhysicalResourceId: Name,
  };
}

async function onDelete(event: SecureStringCustomResourceEvent): Promise<CustomResourceResponse> {
  const { Name } = event.ResourceProperties;
  await ssm.send(new DeleteParameterCommand({
    Name,
  }));
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

async function updateTags(parameterName: string, tags: Record<string, string> | undefined): Promise<void> {
  const { TagList } = await ssm.send(new ListTagsForResourceCommand({
    ResourceType: 'Parameter',
    ResourceId: parameterName,
  }));
  const removableTags = TagList?.reduce((list, tag) => {
    if (tag.Key && !Object.keys(tags || {}).includes(tag.Key)) {
      list.push(tag.Key);
    }
    return list;
  }, [] as string[]);
  if (removableTags?.length) {
    await ssm.send(new RemoveTagsFromResourceCommand({
      ResourceType: 'Parameter',
      ResourceId: parameterName,
      TagKeys: removableTags,
    }));
  }
  if (tags) {
    await ssm.send(new AddTagsToResourceCommand({
      ResourceType: 'Parameter',
      ResourceId: parameterName,
      Tags: Object.entries(tags).map(([key, value]) => {
        return { Key: key, Value: value };
      }),
    }));
  }
}