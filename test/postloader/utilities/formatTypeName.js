// @flow

import test from 'ava';
import formatTypeName from '../../../src/utilities/formatTypeName';

test('pascal cases input and appends RecordType', (t) => {
  t.true(formatTypeName('foo bar baz') === 'FooBarBazRecordType');
});
