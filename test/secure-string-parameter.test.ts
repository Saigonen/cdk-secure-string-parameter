import { Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureStringParameter, ValueType } from '../src/secure-string-parameter';

test('SecureStringParameter', () => {
  const stack = new Stack();

  new SecureStringParameter(stack, 'Parameter', {
    parameterName: 'test',
    stringValue: 'value',
    valueType: ValueType.PLAINTEXT,
  });

  const template = Template.fromStack(stack);

  template.hasResourceProperties('Custom::SecureStringParameter', {
    parameterName: 'test',
    stringValue: 'value',
    valueType: 'plaintext',
  });
});