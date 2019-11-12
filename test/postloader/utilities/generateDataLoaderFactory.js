// @flow

import test from 'ava';
import {
  trim,
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
        name: 'bar',
        tableName: 'foo',
      },
    ],
    [
      {
        columnNames: [
          'bar',
        ],
        indexIsUnique: true,
        indexName: 'quux',
        tableName: 'foo',
      },
    ],
    {},
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

type FooRecordType = {|
  +bar: string
|};

export type {
  FooRecordType
};

export type LoadersType = {|
  +FooByBarLoader: DataLoader<string, FooRecordType>
|};

export const createLoaders = (connection: $Shape<DatabaseConnectionType>, dataLoaderConfigurationMap: Object = {}): LoadersType => {
  const FooByBarLoader = new DataLoader((ids) => {
    return getByIds(connection, 'foo', ids, 'bar', '"bar"', false);
  }, dataLoaderConfigurationMap.FooByBarLoader);

  return {
    FooByBarLoader
  };
};`);

  // eslint-disable-next-line ava/prefer-power-assert
  t.is(actual, expected);
});

test('creates a loader for unique indexes (uses mappedTableName when available)', (t) => {
  const actual = trim(generateDataLoaderFactory(
    [
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'baz',
        name: 'bar',
        tableName: 'foo',
      },
    ],
    [
      {
        columnNames: [
          'bar',
        ],
        indexIsUnique: true,
        indexName: 'quux',
        tableName: 'foo',
      },
    ],
    {},
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

export const createLoaders = (connection: $Shape<DatabaseConnectionType>, dataLoaderConfigurationMap: Object = {}): LoadersType => {
  const BazByBarLoader = new DataLoader((ids) => {
    return getByIds(connection, 'foo', ids, 'bar', '"bar"', false);
  }, dataLoaderConfigurationMap.BazByBarLoader);

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
        tableName: 'foo',
      },
    ],
    [],
    {},
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

export const createLoaders = (connection: $Shape<DatabaseConnectionType>, dataLoaderConfigurationMap: Object = {}): LoadersType => {
  const BazsByBarIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'foo', ids, 'bar_id', '"bar_id" "barId"', true);
  }, dataLoaderConfigurationMap.BazsByBarIdLoader);

  return {
    BazsByBarIdLoader
  };
};`);

  // eslint-disable-next-line ava/prefer-power-assert
  t.is(actual, expected);
});

test('creates a loader for a join table', (t) => {
  const actual = trim(generateDataLoaderFactory(
    [
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'bar',
        name: 'id',
        tableName: 'bar',
      },
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'foo',
        name: 'id',
        tableName: 'foo',
      },
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'bar_foo',
        name: 'bar_id',
        tableName: 'bar_foo',
      },
      {
        comment: '',
        dataType: 'text',
        isMaterializedView: false,
        isNullable: false,
        mappedTableName: 'bar_foo',
        name: 'foo_id',
        tableName: 'bar_foo',
      },
    ],
    [],
    {},
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

type BarRecordType = {|
  +id: string
|};

type FooRecordType = {|
  +id: string
|};

type BarFooRecordType = {|
  +barId: string,
  +fooId: string
|};

export type {
  BarFooRecordType,
  BarRecordType,
  FooRecordType
};

export type LoadersType = {|
  +BarFoosByBarIdLoader: DataLoader<string, $ReadOnlyArray<BarFooRecordType>>,
  +BarFoosByFooIdLoader: DataLoader<string, $ReadOnlyArray<BarFooRecordType>>,
  +BarsByFooIdLoader: DataLoader<string, $ReadOnlyArray<BarRecordType>>,
  +FoosByBarIdLoader: DataLoader<string, $ReadOnlyArray<FooRecordType>>
|};

export const createLoaders = (connection: $Shape<DatabaseConnectionType>, dataLoaderConfigurationMap: Object = {}): LoadersType => {
  const BarFoosByBarIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'bar_foo', ids, 'bar_id', '"bar_id" "barId", "foo_id" "fooId"', true);
  }, dataLoaderConfigurationMap.BarFoosByBarIdLoader);
  const BarFoosByFooIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'bar_foo', ids, 'foo_id', '"bar_id" "barId", "foo_id" "fooId"', true);
  }, dataLoaderConfigurationMap.BarFoosByFooIdLoader);
  const FoosByBarIdLoader = new DataLoader((ids) => {
    return getByIdsUsingJoiningTable(connection, 'bar_foo', 'foo', 'foo', 'bar', 'r2."id"', ids);
  }, dataLoaderConfigurationMap.FoosByBarIdLoader);
  const BarsByFooIdLoader = new DataLoader((ids) => {
    return getByIdsUsingJoiningTable(connection, 'bar_foo', 'bar', 'bar', 'foo', 'r2."id"', ids);
  }, dataLoaderConfigurationMap.BarsByFooIdLoader);

  return {
    BarFoosByBarIdLoader,
    BarFoosByFooIdLoader,
    BarsByFooIdLoader,
    FoosByBarIdLoader
  };
};`);

  // eslint-disable-next-line ava/prefer-power-assert
  t.is(actual, expected);
});
