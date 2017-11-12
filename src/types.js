// @flow

export type {
  DatabaseConnectionType
} from 'mightyql';

export type ColumnType = {|
  +comment: string | null,
  +dataType: string,
  +hasForeignKeyConstraint: boolean,
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
