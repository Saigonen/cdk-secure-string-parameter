import { awscdk } from 'projen';
const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Matti Saikkonen',
  authorAddress: 'matti.saikkonen@gmail.com',
  name: 'cdk-secure-string-parameter',
  description: 'SecureStringParameter Custom Resource for CDK. Enables storing encrypted secrets in version control and using those values in creating SSM SecureString Parameters',
  keywords: ['securestringparameter', 'securestring', 'parameter store', 'cdk', 'ssm', 'encrypted'],
  repositoryUrl: 'https://github.com/saigonen/cdk-secure-string-parameter',
  defaultReleaseBranch: 'main',
  stability: 'experimental',
  projenrcTs: true,
  gitignore: [
    'cdk.out',
  ],
  cdkVersion: '2.24.0',
  integrationTestAutoDiscover: false,
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_16_X,
    bundlingOptions: {
      sourcemap: true,
    },
  },
  devDeps: [
    '@aws-sdk/client-kms',
    '@aws-sdk/client-ssm',
    '@commitlint/cli',
    '@commitlint/config-conventional',
    '@types/aws-lambda',
    '@types/jest@27.4.1', // https://github.com/aws/jsii/issues/3619
    '@types/uuid',
  ],
  deps: [
  ],
  peerDeps: [
  ],
  bundledDeps: [
    'uuid',
  ],
});
project.synth();