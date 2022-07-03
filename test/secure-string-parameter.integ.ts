import * as cdk from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { SecureStringParameter, ValueType } from '../src/index';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'Stack');

new SecureStringParameter(stack, 'SecureParameter', {
  parameterName: '/integ/secure',
  stringValue: 'foo',
  valueType: ValueType.PLAINTEXT,
});

new StringParameter(stack, 'RegularParameter', {
  parameterName: '/integ/regular',
  stringValue: 'bar',
});
