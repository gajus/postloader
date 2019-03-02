// @flow

import pluralize from 'pluralize';
import {
  camelCase,
  upperFirst
} from 'lodash';
import type {
  ColumnType,
  DataTypeMapType,
  IndexType
} from '../types';
import {
  UnexpectedStateError
} from '../errors';
import Logger from '../Logger';
import generateFlowTypeDocument from './generateFlowTypeDocument';
import indent from './indent';
import isJoiningTable from './isJoiningTable';
import createColumnSelector from './createColumnSelector';
import createLoaderTypePropertyDeclaration from './createLoaderTypePropertyDeclaration';
import pluralizeTableName from './pluralizeTableName';

const log = Logger.child({
  namespace: 'generateDataLoaderFactory'
});

const createLoaderByIdsDeclaration = (loaderName: string, tableName: string, keyColumnName, columnSelector: string, resultIsArray: boolean) => {
  return `const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${tableName}', ids, '${keyColumnName}', '${columnSelector}', ${String(resultIsArray)}, NotFoundError);
});`;
};

const createLoaderByIdsUsingJoiningTableDeclaration = (
  loaderName: string,
  joiningTableName: string,
  targetResourceTableName: string,
  joiningKeyName: string,
  lookupKeyName: string,
  columnSelector: string
) => {
  return `const ${loaderName} = new DataLoader((ids) => {
  return getByIdsUsingJoiningTable(connection, '${joiningTableName}', '${targetResourceTableName}', '${joiningKeyName}', '${lookupKeyName}', '${columnSelector}', ids);
});`;
};

// eslint-disable-next-line complexity
export default (
  unnormalisedColumns: $ReadOnlyArray<ColumnType>,
  indexes: $ReadOnlyArray<IndexType>,
  dataTypeMap: DataTypeMapType,
): string => {
  const columns = unnormalisedColumns
    .map((column) => {
      return {
        ...column,
        mappedTableName: column.mappedTableName || column.tableName
      };
    });

  if (columns.length === 0) {
    throw new UnexpectedStateError('Must know multiple columns.');
  }

  const tableNames = columns
    .map((column) => {
      return column.tableName;
    })
    .filter((tableName, index, self) => {
      return self.indexOf(tableName) === index;
    });

  const loaders = [];
  const loaderNames = [];
  const loaderTypes = [];

  for (const tableName of tableNames) {
    const tableColumns = columns.filter((column) => {
      return column.tableName === tableName;
    });

    if (tableColumns.length === 0) {
      continue;
    }

    const mappedTableName = tableColumns[0].mappedTableName;

    const resouceName = upperFirst(camelCase(mappedTableName));

    for (const tableColumn of tableColumns) {
      const tableColumnSelector = createColumnSelector(tableColumns);

      if (tableColumn.name.endsWith('_id')) {
        const loaderName = pluralize(resouceName) + 'By' + upperFirst(camelCase(tableColumn.name)) + 'Loader';

        loaders.push(createLoaderByIdsDeclaration(loaderName, tableName, tableColumn.name, tableColumnSelector, true));

        const loaderType = createLoaderTypePropertyDeclaration(
          loaderName,
          dataTypeMap[tableColumn.dataType] ? dataTypeMap[tableColumn.dataType] : tableColumn.dataType,
          tableColumn.mappedTableName,
          true
        );

        loaderTypes.push(loaderType);

        loaderNames.push(loaderName);
      }
    }

    const tableUniqueIndexes = indexes.filter((index) => {
      return index.tableName === tableName && index.indexIsUnique === true && index.columnNames.length === 1;
    });

    for (const tableUniqueIndex of tableUniqueIndexes) {
      const tableColumnSelector = createColumnSelector(tableColumns);

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

      const loaderName = resouceName + 'By' + upperFirst(camelCase(indexColumn.name)) + 'Loader';

      loaders.push(createLoaderByIdsDeclaration(loaderName, tableName, indexColumn.name, tableColumnSelector, false));

      const loaderType = createLoaderTypePropertyDeclaration(
        loaderName,
        dataTypeMap[indexColumn.dataType] ? dataTypeMap[indexColumn.dataType] : indexColumn.dataType,
        indexColumn.mappedTableName,
        false
      );

      loaderTypes.push(loaderType);

      loaderNames.push(loaderName);
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

      if (loaderNames.includes(loaderName)) {
        continue;
      }

      const resourceTableColumns = columns.filter((column) => {
        return column.mappedTableName === relation.resource;
      });

      if (!resourceTableColumns.length) {
        log.warn({
          relation
        }, 'resource without columns');

        continue;
      }

      const realResourceTableName = resourceTableColumns[0].tableName;

      const tableColumnSelector = createColumnSelector(resourceTableColumns, 'r2');

      loaders.push(createLoaderByIdsUsingJoiningTableDeclaration(loaderName, tableName, realResourceTableName, relation.resource, relation.key, tableColumnSelector));

      const keyColumn = tableColumns.find((column) => {
        return column.name === relation.key + '_id';
      });

      if (!keyColumn) {
        throw new Error('Unexpected state.');
      }

      const loaderType = createLoaderTypePropertyDeclaration(
        loaderName,
        dataTypeMap[keyColumn.dataType] ? dataTypeMap[keyColumn.dataType] : keyColumn.dataType,
        relation.resource,
        true
      );

      loaderTypes.push(loaderType);

      loaderNames.push(loaderName);
    }
  }

  loaderTypes.sort((a, b) => {
    return a.localeCompare(b);
  });

  loaderNames.sort((a, b) => {
    return a.localeCompare(b);
  });

  return `// @flow

import {
  getByIds,
  getByIdsUsingJoiningTable,
  NotFoundError
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'slonik';
${generateFlowTypeDocument(columns, dataTypeMap)}

export type LoadersType = {|
${loaderTypes.map((body) => {
    return indent(body, 2);
  }).sort().join(',\n')}
|};

export const createLoaders = (connection: DatabaseConnectionType): LoadersType => {
${loaders
    .map((body) => {
      return indent(body, 2);
    })
    .join('\n')}

  return {
${loaderNames
    .map((body) => {
      return indent(body, 4);
    })
    .join(',\n')}
  };
};`;
};
