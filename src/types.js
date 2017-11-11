// @flow

export type {
  DatabaseConnectionType
} from 'mightyql';

export type ColumnType = {|
  +columnName: string,
  +dataType: string,
  +isMaterializedView: boolean,
  +isNullable: boolean,
  +tableName: string
|};

export type IndexType = {|
  +columnName: string,
  +idIsUnique: boolean,
  +indexName: string,
  +tableName: string
|};

export type TypePropertyType = {|
  +column: ColumnType,
  +name: string,
  +type: string,
  +typeName: string
|};
