// @flow

import test from 'ava';
import type {ColumnType, StandardLoaderConfigType, ThruLoaderConfigType} from '../../../src/types';
import {StandardLoader, ThruJoinLoader} from '../../../src/utilities/output/loader';

const createColumn = (columnName: string, type: string): ColumnType => {
  // eslint-disable-next-line no-extra-parens
  return ({
    dataType: type,
    name: columnName
  }: any);
};

const fixture: StandardLoaderConfigType = {
  columnSelector: '"name"',
  keyColumn: createColumn('id', 'serial'),
  name: 'UserLoaderById',
  resourceName: 'user',
  resultIsArray: false,
  tableName: 'example_table'
};

const fixture2: StandardLoaderConfigType = {
  columnSelector: '"name"',
  keyColumn: createColumn('id', 'serial'),
  name: 'UserLoaderById',
  resourceName: 'user',
  resultIsArray: true,
  tableName: 'example_table'
};

const fixture3: ThruLoaderConfigType = {
  columnSelector: '"name"',
  joiningKeyColumn: createColumn('user_id', 'serial'),
  joiningTableName: 'user_tag',
  lookupKeyName: 'tag_id',
  name: 'UserLoaderById',
  resourceName: 'user',
  targetTableName: 'user'
};

test('Standard Loader produces type definition', (t) => {
  const loader = new StandardLoader(fixture);

  const expectedTypescript = 'readonly UserLoaderById: DataLoader<number, UserRecordType>';
  const expectedFlow = '+UserLoaderById: DataLoader<number, UserRecordType>';

  t.true(loader.definition('typescript') === expectedTypescript);
  t.true(loader.definition('flow') === expectedFlow);
});

test('Standard Loader produces type definition, when array is returned', (t) => {
  const loader = new StandardLoader(fixture2);

  const expectedTypescript = 'readonly UserLoaderById: DataLoader<number, UserRecordType[]>';
  const expectedFlow = '+UserLoaderById: DataLoader<number, $ReadOnlyArray<UserRecordType>>';

  t.true(loader.definition('typescript') === expectedTypescript);
  t.true(loader.definition('flow') === expectedFlow);
});

test('Standard Loader produces createLoader call', (t) => {
  const loader = new StandardLoader(fixture);

  const expectedTypescript = `const UserLoaderById = new DataLoader<number, UserRecordType>((ids) => {
  return getByIds(connection, 'example_table', ids, 'id', '"name"', false, NotFoundError);
});`;

  const expectedFlow = `const UserLoaderById = new DataLoader((ids) => {
  return getByIds(connection, 'example_table', ids, 'id', '"name"', false, NotFoundError);
});`;

  t.true(loader.createLoader('typescript') === expectedTypescript);
  t.true(loader.createLoader('flow') === expectedFlow);
});

test('Standard Loader produces createLoader call, when array is returned', (t) => {
  const loader = new StandardLoader(fixture2);

  const expectedTypescript = `const UserLoaderById = new DataLoader<number, UserRecordType[]>((ids) => {
  return getByIds(connection, 'example_table', ids, 'id', '"name"', true, NotFoundError);
});`;

  const expectedFlow = `const UserLoaderById = new DataLoader((ids) => {
  return getByIds(connection, 'example_table', ids, 'id', '"name"', true, NotFoundError);
});`;

  t.true(loader.createLoader('typescript') === expectedTypescript);
  t.true(loader.createLoader('flow') === expectedFlow);
});

test('ThruJoinLoader produces correct definition', (t) => {
  const loader = new ThruJoinLoader(fixture3);

  const expectedTypescript = 'readonly UserLoaderById: DataLoader<number, UserRecordType>';
  const expectedFlow = '+UserLoaderById: DataLoader<number, UserRecordType>';

  t.true(loader.definition('typescript') === expectedTypescript);
  t.true(loader.definition('flow') === expectedFlow);
});

test('ThruJoinLoader produces correct loader', (t) => {
  const loader = new ThruJoinLoader(fixture3);

  const expectedTypescript = `const UserLoaderById = new DataLoader<number, UserRecordType>((ids) => {
  return getByIdsUsingJoiningTable(connection, 'user_tag', 'user', 'user_id', 'tag_id', '"name"', ids);
});`;

  const expectedFlow = `const UserLoaderById = new DataLoader((ids) => {
  return getByIdsUsingJoiningTable(connection, 'user_tag', 'user', 'user_id', 'tag_id', '"name"', ids);
});`;

  t.true(loader.createLoader('typescript') === expectedTypescript);
  t.true(loader.createLoader('flow') === expectedFlow);
});

