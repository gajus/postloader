// @flow

import test from 'ava';
import isJoiningTable from '../../../src/utilities/isJoiningTable';
import {
  createColumnWithName,
} from '../../helpers';

test('correctly recognizes a joining table (genre_movie)', (t) => {
  const tableIsJoining = isJoiningTable(
    'genre_movie',
    [
      createColumnWithName('genre_id'),
      createColumnWithName('movie_id'),
    ],
  );

  t.true(tableIsJoining);
});

test('correctly recognizes a joining table (event_event_attribute)', (t) => {
  const tableIsJoining = isJoiningTable(
    'event_event_attribute',
    [
      createColumnWithName('event_id'),
      createColumnWithName('event_attribute_id'),
    ],
  );

  t.true(tableIsJoining);
});

test('correctly recognizes not a joining table', (t) => {
  const tableIsJoining = isJoiningTable(
    'genre_movie',
    [
      createColumnWithName('id'),
      createColumnWithName('name'),
    ],
  );

  t.false(tableIsJoining);
});
