// @flow

import {
  createConnection
} from 'slonik';
import type {
  ColumnType,
  OutputType
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
  +tableNameMapper: string | null,
  +output: OutputType
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
      output: {
        choices: ['flow', 'typescript'],
        default: 'flow',
        description: 'Choose whether flow or typescript definitions are generated',
        type: 'string'
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

  const indexes = await getDatabaseIndexes(connection);

  // eslint-disable-next-line no-console
  console.log(generateDataLoaderFactory(normalizedColumns, indexes, argv.output));

  await connection.end();
};
