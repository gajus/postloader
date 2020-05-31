// @flow

export type {
  DatabaseConnectionType,
} from 'slonik';

export type DataTypeMapType = {
  +[key: string]: string,
  ...
};

export type ColumnType = {|
  +comment: string | null,
  +dataType: string,
  +isMaterializedView: boolean,
  +isNullable: boolean,
  +mappedTableName?: string,
  +name: string,
  +tableName: string,
|};

export type IndexType = {|
  +columnNames: $ReadOnlyArray<string>,
  +indexIsUnique: boolean,
  +indexName: string,
  +tableName: string,
|};
