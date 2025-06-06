import { awscdk } from 'projen';
import { UpgradeDependenciesSchedule } from 'projen/lib/javascript';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Matti Saikkonen',
  authorAddress: 'matti.saikkonen@gmail.com',
  name: 'cdk-secure-string-parameter',
  description: 'SecureStringParameter Custom Resource for CDK. Enables storing encrypted secrets in version control and using those values in creating SSM SecureString Parameters',
  keywords: ['secure string parameter', 'securestring', 'stringparameter', 'parameter store', 'cdk', 'ssm', 'encrypted'],
  repositoryUrl: 'https://github.com/saigonen/cdk-secure-string-parameter',
  defaultReleaseBranch: 'main',
  stability: 'experimental',
  projenrcTs: true,
  gitignore: [
    'cdk.out',
    '.vscode',
  ],
  pullRequestTemplate: false,
  workflowNodeVersion: '22.x',
  cdkVersion: '2.123.0',
  jsiiVersion: '^5.8',
  jestOptions: {},
  integrationTestAutoDiscover: false,
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: UpgradeDependenciesSchedule.MONTHLY,
    },
  },
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_22_X,
    bundlingOptions: {
      sourcemap: true,
    },
  },
  scripts: {
    prepare: 'husky',
  },
  devDeps: [
    '@aws-sdk/client-kms',
    '@aws-sdk/client-ssm',
    '@commitlint/cli',
    '@commitlint/config-conventional',
    '@stylistic/eslint-plugin@4.4.0',
    '@types/aws-lambda',
    '@types/uuid',
    'husky',
  ],
  deps: [
  ],
  peerDeps: [
  ],
  bundledDeps: [
    'uuid',
  ],
});

project.addPackageIgnore('cdk.out');

project.synth();