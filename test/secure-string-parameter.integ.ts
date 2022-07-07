import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { SecureStringParameter, ValueType } from '../src/index';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'Stack', {
  tags: { 'stack-props-tag': 'stack-props-value' },
});

const secureParameter = new SecureStringParameter(stack, 'SecureParameter', {
  parameterName: '/integ/secure',
  stringValue: 'foo',
  valueType: ValueType.PLAINTEXT,
});

const regularParameter = new StringParameter(stack, 'RegularParameter', {
  parameterName: '/integ/regular',
  stringValue: 'bar',
});

Tags.of(stack).add('stack-tag', 'stack-value');
Tags.of(secureParameter).add('secure-tag', 'secure-value');
Tags.of(regularParameter).add('regular-tag', 'regular-value');
