// @flow
import {StandardLoader, ThruJoinLoader} from './utilities/output/loader';

export type {
  DatabaseConnectionType
} from 'slonik';

export type ColumnType = {|
  +comment: string | null,
  +dataType: string,
  +isMaterializedView: boolean,
  +isNullable: boolean,
  +mappedTableName: string,
  +name: string,
  +tableName: string
|};

export type IndexType = {|
  +columnNames: $ReadOnlyArray<string>,
  +indexIsUnique: boolean,
  +indexName: string,
  +tableName: string
|};

export type OutputType = "flow" | "typescript";

export interface Loader {
  definition(format: OutputType): string,
  createLoader(format: OutputType): string
}

export type StandardLoaderConfigType = {
  +name: string,
  +tableName: string,
  +keyColumn: ColumnType,
  +columnSelector: string,
  +resultIsArray: boolean,
  +resourceName: string
};

export type ThruLoaderConfigType = {|
  +name: string,
  +resourceName: string,
  +joiningTableName: string,
  +targetTableName: string,
  +joiningKeyColumn: ColumnType,
  +lookupKeyName: string,
  +columnSelector: string
|};

export type LoadersType = Array<StandardLoader | ThruJoinLoader>;
