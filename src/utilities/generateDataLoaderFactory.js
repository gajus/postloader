// @flow

import pluralize from 'pluralize';
import {
  camelCase,
  upperFirst
} from 'lodash';
import type {
  ColumnType,
  IndexType,
  OutputType,
  LoadersType
} from '../types';
import isJoiningTable from './isJoiningTable';
import createColumnSelector from './createColumnSelector';
import pluralizeTableName from './pluralizeTableName';
import createTypeScript from './output/createTypescript';
import createFlowType from './output/createFlow';
import {StandardLoader, ThruJoinLoader} from './output/loader';

// eslint-disable-next-line complexity
export default (
  columns: $ReadOnlyArray<ColumnType>,
  indexes: $ReadOnlyArray<IndexType>,
  output: OutputType = 'flow'
): string => {
  const tableNames = columns
    .map((column) => {
      return column.tableName;
    })
    .filter((tableName, index, self) => {
      return self.indexOf(tableName) === index;
    });

  const loaders: LoadersType = [];

  for (const tableName of tableNames) {
    const tableColumns = columns.filter((column) => {
      return column.tableName === tableName;
    });

    if (tableColumns.length === 0) {
      continue;
    }

    const mappedTableName = tableColumns[0].mappedTableName;

    const resourceName = upperFirst(camelCase(mappedTableName));

    for (const tableColumn of tableColumns) {
      const tableColumnSelector = createColumnSelector(tableColumns);

      if (tableColumn.name.endsWith('_id')) {
        const loaderName = pluralize(resourceName) + 'By' + upperFirst(camelCase(tableColumn.name)) + 'Loader';

        loaders.push(new StandardLoader({
          columnSelector: tableColumnSelector,
          keyColumn: tableColumn,
          name: loaderName,
          resourceName,
          resultIsArray: true,
          tableName
        }));
      }
    }

    const tableUniqueIndexes = indexes.filter((index) => {
      return index.tableName === tableName && index.indexIsUnique === true && index.columnNames.length === 1;
    });

    for (const tableUniqueIndex of tableUniqueIndexes) {
      const maybeIndexColumnName = tableUniqueIndex.columnNames[0];

      if (!maybeIndexColumnName) {
        throw new Error('Unexpected state.');
      }

      const indexColumn = tableColumns.find((column) => {
        return column.name === maybeIndexColumnName;
      });

      if (!indexColumn) {
        throw new Error('Unexpected state.');
      }

      const loaderName = resourceName + 'By' + upperFirst(camelCase(indexColumn.name)) + 'Loader';

      loaders.push(new StandardLoader({
        columnSelector: createColumnSelector(tableColumns),
        keyColumn: indexColumn,
        name: loaderName,
        resourceName: indexColumn.mappedTableName,
        resultIsArray: false,
        tableName
      }));
    }
  }

  for (const tableName of tableNames) {
    const tableColumns = columns.filter((column) => {
      return column.tableName === tableName;
    });

    if (tableColumns.length === 0) {
      continue;
    }

    if (!isJoiningTable(tableName, tableColumns)) {
      continue;
    }

    const firstIdColumnNames = tableColumns
      .map((column) => {
        return column.name;
      })
      .filter((columnName) => {
        return columnName.endsWith('_id');
      })
      .map((columnName) => {
        return columnName.slice(0, -3);
      })
      .slice(0, 2);

    if (firstIdColumnNames.length < 2) {
      throw new Error('Unexpected state.');
    }

    const relations = [
      {
        key: firstIdColumnNames[0],
        resource: firstIdColumnNames[1]
      },
      {
        key: firstIdColumnNames[1],
        resource: firstIdColumnNames[0]
      }
    ];

    for (const relation of relations) {
      const loaderName = upperFirst(camelCase(pluralizeTableName(relation.resource))) + 'By' + upperFirst(camelCase(relation.key + '_id')) + 'Loader';

      if (loaders.find((loader) => {
        return loader.loaderName === loaderName;
      })) {
        continue;
      }

      const resourceTableColumns = columns.filter((column) => {
        return column.mappedTableName === relation.resource;
      });

      const realResourceTableName = resourceTableColumns[0].tableName;

      const keyColumn = tableColumns.find((column) => {
        return column.name === relation.key + '_id';
      });

      if (!keyColumn) {
        throw new Error('Unexpected state.');
      }

      loaders.push(new ThruJoinLoader({
        columnSelector: createColumnSelector(resourceTableColumns, 'r2'),
        joiningKeyColumn: keyColumn,
        joiningTableName: tableName,
        lookupKeyName: relation.key,
        name: loaderName,
        resourceName: realResourceTableName,
        targetTableName: realResourceTableName
      }));
    }
  }

  loaders.sort((a, b) => {
    return a.loaderName.localeCompare(b.loaderName);
  });

  switch (output) {
  case 'flow':
    return createFlowType(columns, loaders);
  case 'typescript':
    return createTypeScript(columns, loaders);
  default:
    throw new Error(`Invalid output type - expected flow or typescript, got ${output}`);
  }
};
