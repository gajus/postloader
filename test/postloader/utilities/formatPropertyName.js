// @flow

import test from 'ava';
import formatPropertyName from '../../../src/utilities/formatPropertyName';

test('camel cases the input', (t) => {
  t.is(formatPropertyName('foo bar baz'), 'fooBarBaz');
});
