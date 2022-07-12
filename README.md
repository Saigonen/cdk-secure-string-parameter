# cdk-secure-string-parameter

[![source](https://img.shields.io/badge/source-github-blue?logo=github)](https://github.com/saigonen/cdk-secure-string-parameter)
![build](https://img.shields.io/github/workflow/status/saigonen/cdk-secure-string-parameter/build)
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
