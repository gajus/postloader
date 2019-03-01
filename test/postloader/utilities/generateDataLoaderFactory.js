// @flow

import test from 'ava';
import {
  trim
} from 'lodash';
import generateDataLoaderFactory from '../../../src/utilities/generateDataLoaderFactory';

test('creates a loader for unique indexes', (t) => {
  const actual = trim(generateDataLoaderFactory(
    [
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'baz',
        name: 'bar',
        tableName: 'foo'
      }
    ],
    [
      {
        columnNames: [
          'bar'
        ],
        indexIsUnique: true,
        indexName: 'quux',
        tableName: 'foo'
      }
    ],
    {}
  ));

  const expected = trim(`
// @flow

import {
  getByIds,
  getByIdsUsingJoiningTable
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'slonik';

type BazRecordType = {|
  +bar: string
|};

export type {
  BazRecordType
};

export type LoadersType = {|
  +BazByBarLoader: DataLoader<string, BazRecordType>
|};

export const createLoaders = (connection: DatabaseConnectionType, NotFoundError: Class<Error>): LoadersType => {
  const BazByBarLoader = new DataLoader((ids) => {
    return getByIds(connection, 'foo', ids, 'bar', '"bar"', false, NotFoundError);
  });

  return {
    BazByBarLoader
  };
};`);

  // eslint-disable-next-line ava/prefer-power-assert
  t.is(actual, expected);
});

test('creates a loader for _id columns', (t) => {
  const actual = trim(generateDataLoaderFactory(
    [
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'baz',
        name: 'bar_id',
        tableName: 'foo'
      }
    ],
    [],
    {}
  ));

  const expected = trim(`
// @flow

import {
  getByIds,
  getByIdsUsingJoiningTable
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'slonik';

type BazRecordType = {|
  +barId: string
|};

export type {
  BazRecordType
};

export type LoadersType = {|
  +BazsByBarIdLoader: DataLoader<string, $ReadOnlyArray<BazRecordType>>
|};

export const createLoaders = (connection: DatabaseConnectionType, NotFoundError: Class<Error>): LoadersType => {
  const BazsByBarIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'foo', ids, 'bar_id', '"bar_id" "barId"', true, NotFoundError);
  });

  return {
    BazsByBarIdLoader
  };
};`);

  // eslint-disable-next-line ava/prefer-power-assert
  t.is(actual, expected);
});
