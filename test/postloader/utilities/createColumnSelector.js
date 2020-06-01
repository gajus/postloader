// @flow

import test from 'ava';
import createColumnSelector from '../../../src/utilities/createColumnSelector';
import {
  createColumnWithName,
} from '../../helpers';

test('creates multiple column selector', (t) => {
  const columnSelector = createColumnSelector([
    createColumnWithName('foo'),
    createColumnWithName('bar_baz'),
  ]);

  t.is(columnSelector, '"foo", "bar_baz" "barBaz"');
});

test('creates multiple column selector using an alias', (t) => {
  const columnSelector = createColumnSelector([
    createColumnWithName('foo'),
    createColumnWithName('bar_baz'),
  ], 't1');

  t.is(columnSelector, 't1."foo", t1."bar_baz" "barBaz"');
});
