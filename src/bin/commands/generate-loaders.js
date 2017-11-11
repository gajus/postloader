// @flow

import {
  createConnection
} from 'mightyql';
import type {
  ColumnType
} from '../../types';
import {
  getDatabaseColumns,
  getDatabaseIndexes
} from '../../queries';
import {
  generateDataLoaderFactory
} from '../../utilities';

export const command = 'generate-loaders';
export const desc = '';

type ConfigurationType = {|
  +columnFilter: string | null,
  +databaseConnectionUri: string,
  +tableNameMapper: string | null
|};

export const builder = (yargs: *): void => {
  yargs
    .options({
      'column-filter': {
        description: 'Function used to filter columns. Function is constructed using `new Function`. Function receives table name as the first parameter, column name as the second parameter and all database columns as the third parameter (parameter names are "tableName", "columnName" and "columns").',
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

type ColumnFilterType = (tableName: string, columnName: string, columns: $ReadOnlyArray<ColumnType>) => boolean;
type TableNameMapperType = (tableName: string, columns: $ReadOnlyArray<ColumnType>) => string;

export const handler = async (argv: ConfigurationType): Promise<void> => {
  // eslint-disable-next-line no-extra-parens, no-new-func
  const filterColumn: ColumnFilterType = (argv.columnFilter ? new Function('tableName', 'columnName', 'columns', argv.columnFilter) : null: any);

  // eslint-disable-next-line no-extra-parens, no-new-func
  const mapTableName: TableNameMapperType = (argv.tableNameMapper ? new Function('tableName', 'columns', argv.tableNameMapper) : null: any);

  const connection = await createConnection(argv.databaseConnectionUri);

  const columns = await getDatabaseColumns(connection);

  const normalizedColumns = columns
    .filter((column) => {
      if (!filterColumn) {
        return true;
      }

      return filterColumn(column.tableName, column.columnName, columns);
    })
    .map((column) => {
      if (!mapTableName) {
        return column;
      }

      return {
        ...column,
        tableName: mapTableName(column.tableName, columns)
      };
    });

  const indexes = await getDatabaseIndexes(connection);

  // eslint-disable-next-line no-console
  console.log(generateDataLoaderFactory(normalizedColumns, indexes));

  await connection.end();
};
