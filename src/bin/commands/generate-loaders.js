// @flow

import {
  createPool
} from 'slonik';
import type {
  ColumnType,
  DataTypeMapType
} from '../../types';
import {
  getDatabaseColumns,
  getDatabaseIndexes
} from '../../queries';
import {
  generateDataLoaderFactory
} from '../../utilities';

type ArgvType = {|
  +columnFilter?: string,
  +dataTypeMap?: string,
  +databaseConnectionUri: string,
  +tableNameMapper?: string
|};

type ColumnFilterType = (tableName: string, columnName: string, columns: $ReadOnlyArray<ColumnType>) => boolean;
type TableNameMapperType = (tableName: string, columns: $ReadOnlyArray<ColumnType>) => string;

export const command = 'generate-loaders';
export const desc = '';

export const builder = (yargs: Object): void => {
  yargs
    .options({
      'column-filter': {
        description: 'Function used to filter columns. Function is constructed using `new Function`. Function receives table name as the first parameter, column name as the second parameter and all database columns as the third parameter (parameter names are "tableName", "columnName" and "columns").',
        type: 'string'
      },
      'data-type-map': {
        description: 'A JSON string describing an object mapping user-defined database types to Flow types, e.g. {"email": "string"}',
        type: 'string'
      },
      'database-connection-uri': {
        demand: true
      },
      'table-name-mapper': {
        description: 'Function used to map table names. Function is constructed using `new Function`. Function receives table name as the first parameter and all database columns as the second parameter (parameter names are "tableName" and "columns").',
        type: 'string'
      }
    });
};

export const handler = async (argv: ArgvType): Promise<void> => {
  // eslint-disable-next-line no-extra-parens, no-new-func
  const filterColumn: ColumnFilterType = (argv.columnFilter ? new Function('tableName', 'columnName', 'columns', argv.columnFilter) : null: any);

  // eslint-disable-next-line no-extra-parens, no-new-func
  const mapTableName: TableNameMapperType = (argv.tableNameMapper ? new Function('tableName', 'columns', argv.tableNameMapper) : null: any);

  const dataTypeMap: DataTypeMapType = argv.dataTypeMap ? JSON.parse(argv.dataTypeMap) : {};

  const pool = await createPool(argv.databaseConnectionUri);

  const columns = await getDatabaseColumns(pool);

  const normalizedColumns = columns
    .filter((column) => {
      if (!filterColumn) {
        return true;
      }

      return filterColumn(column.tableName, column.name, columns);
    })
    .map((column) => {
      return {
        ...column,
        isNullable: column.comment && column.comment.includes('POSTLOAD_NOTNULL') ? false : column.isNullable
      };
    })
    .map((column) => {
      if (!mapTableName) {
        return column;
      }

      return {
        ...column,
        mappedTableName: mapTableName(column.tableName, columns)
      };
    });

  const indexes = await getDatabaseIndexes(pool);

  // eslint-disable-next-line no-console
  console.log(generateDataLoaderFactory(normalizedColumns, indexes, dataTypeMap));
};
