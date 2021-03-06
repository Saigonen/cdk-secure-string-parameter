import { CfnElement, Stack, Tags } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { Alias, IKey, Key } from 'aws-cdk-lib/aws-kms';
import { SecureStringParameter, ValueType } from '../src/secure-string-parameter';

describe('SecureStringParameter', () => {

  test('plaintext', () => {
    const stack = new Stack();
    new SecureStringParameter(stack, 'Parameter', {
      parameterName: 'test',
      stringValue: 'value',
      valueType: ValueType.PLAINTEXT,
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('Custom::SecureStringParameter', {
      Name: 'test',
      Value: 'value',
      ValueType: 'plaintext',
    });
  });

  describe('Encrypted', () => {

    function expectedPolicy(keyResource: any) {
      return {
        PolicyDocument: {
          Statement: [
            {
              Action: [
                'ssm:PutParameter',
                'ssm:DeleteParameter',
                'ssm:GetParameters',
                'ssm:ListTagsForResource',
                'ssm:AddTagsToResource',
                'ssm:RemoveTagsFromResource',
              ],
              Effect: 'Allow',
              Resource: '*',
            },
            {
              Action: [
                'kms:Decrypt',
                'kms:Encrypt',
              ],
              Effect: 'Allow',
              Resource: keyResource,
            },
          ],
          Version: '2012-10-17',
        },
      };
    };

    function createSecureStringParameter(stack: Stack, key: IKey) {
      new SecureStringParameter(stack, 'Parameter', {
        encryptionKey: key,
        parameterName: 'test',
        stringValue: 'encryptedvalue',
        valueType: ValueType.ENCRYPTED,
      });
    };

    function assertResourceProperties(template: Template, key: any) {
      template.hasResourceProperties('Custom::SecureStringParameter', {
        EncryptionKey: key,
        Name: 'test',
        Value: 'encryptedvalue',
        ValueType: 'encrypted',
      });
    }

    test('with new key', () => {
      const stack = new Stack();
      const key = new Key(stack, 'Key');
      createSecureStringParameter(stack, key);
      const template = Template.fromStack(stack);
      const keyId = stack.getLogicalId(key.node.defaultChild as CfnElement);
      assertResourceProperties(template, { Ref: keyId });
      const keyResource = { 'Fn::GetAtt': [keyId, 'Arn'] };
      template.hasResourceProperties('AWS::IAM::Policy', expectedPolicy(keyResource));
    });

    test('with new alias and key', () => {
      const stack = new Stack();
      const key = new Key(stack, 'Key');
      const alias = new Alias(stack, 'Alias', {
        aliasName: 'alias/custom',
        targetKey: key,
      });
      createSecureStringParameter(stack, alias);
      const template = Template.fromStack(stack);
      assertResourceProperties(template, 'alias/custom');
      const keyId = stack.getLogicalId(key.node.defaultChild as CfnElement);
      const keyResource = { 'Fn::GetAtt': [keyId, 'Arn'] };
      template.hasResourceProperties('AWS::IAM::Policy', expectedPolicy(keyResource));
    });

    test('with new alias from existing key', () => {
      const stack = new Stack(undefined, undefined, { env: { account: '123456789012', region: 'us-east-1' } });
      const key = Key.fromLookup(stack, 'Key', { aliasName: 'alias/custom' });
      const alias = new Alias(stack, 'Alias', {
        aliasName: 'alias/second',
        targetKey: key,
      });
      createSecureStringParameter(stack, alias);
      const template = Template.fromStack(stack);
      assertResourceProperties(template, 'alias/second');
      const keyResource = { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab']] };
      template.hasResourceProperties('AWS::IAM::Policy', expectedPolicy(keyResource));
    });

    test('with existing key', () => {
      const stack = new Stack(undefined, undefined, { env: { account: '123456789012', region: 'us-east-1' } });
      const key = Key.fromLookup(stack, 'Key', { aliasName: 'alias/custom' });
      createSecureStringParameter(stack, key);
      const template = Template.fromStack(stack);
      assertResourceProperties(template, '1234abcd-12ab-34cd-56ef-1234567890ab');
      const keyResource = { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab']] };
      template.hasResourceProperties('AWS::IAM::Policy', expectedPolicy(keyResource));
    });

    test('with existing alias', () => {
      const stack = new Stack(undefined, undefined, { env: { account: '123456789012', region: 'us-east-1' } });
      const alias = Alias.fromAliasName(stack, 'Alias', 'alias/custom');
      createSecureStringParameter(stack, alias);
      const template = Template.fromStack(stack);
      assertResourceProperties(template, 'alias/custom');
      const keyResource = { 'Fn::Join': ['', ['arn:', { Ref: 'AWS::Partition' }, ':kms:us-east-1:123456789012:key/1234abcd-12ab-34cd-56ef-1234567890ab']] };
      template.hasResourceProperties('AWS::IAM::Policy', expectedPolicy(keyResource));
    });

  });

  describe('Tags', () => {

    function createSecureStringParameter(stack: Stack) {
      return new SecureStringParameter(stack, 'Parameter', {
        stringValue: 'value',
        valueType: ValueType.PLAINTEXT,
      });
    }

    function assertHasTags(template: Template) {
      template.hasResourceProperties('Custom::SecureStringParameter', {
        Value: 'value',
        ValueType: 'plaintext',
        Tags: { 'test-tag': 'test-value' },
      });
    }

    function assertHasNotTags(template: Template) {
      template.hasResourceProperties('Custom::SecureStringParameter', {
        Value: 'value',
        ValueType: 'plaintext',
        Tags: Match.absent(),
      });
    }

    test('without tags', () => {
      const stack = new Stack();
      createSecureStringParameter(stack);
      const template = Template.fromStack(stack);
      assertHasNotTags(template);
    });

    test('with direct tags', () => {
      const stack = new Stack();
      const parameter = createSecureStringParameter(stack);
      Tags.of(parameter).add('test-tag', 'test-value');
      const template = Template.fromStack(stack);
      assertHasTags(template);
    });

    test('with stack tags', () => {
      const stack = new Stack();
      Tags.of(stack).add('test-tag', 'test-value');
      createSecureStringParameter(stack);
      const template = Template.fromStack(stack);
      assertHasTags(template);
    });

    test('with tags in stack props', () => {
      const stack = new Stack(undefined, undefined, {
        tags: { 'test-tag': 'test-value' },
      });
      createSecureStringParameter(stack);
      const template = Template.fromStack(stack);
      assertHasTags(template);
    });

  });
});