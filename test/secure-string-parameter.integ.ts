import * as cdk from 'aws-cdk-lib';
import { SecureStringParameter, ValueType } from '../src/index';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'Stack');

new SecureStringParameter(stack, 'Parameter', {
  parameterName: 'foo',
  stringValue: 'bar',
  valueType: ValueType.PLAINTEXT,
});
