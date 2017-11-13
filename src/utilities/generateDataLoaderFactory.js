// @flow

import pluralize from 'pluralize';
import {
  camelCase,
  upperFirst
} from 'lodash';
import type {
  ColumnType,
  IndexType
} from '../types';
import formatTypeName from './formatTypeName';
import generateFlowTypeDocument from './generateFlowTypeDocument';
import indent from './indent';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

// @todo Support multi-word joinign tables.
const isJoiningTable = (tableName: string, columns: $ReadOnlyArray<ColumnType>): boolean => {
  const parties = tableName.split('_');

  if (parties.length !== 2) {
    return false;
  }

  for (const partyName of parties) {
    const party = columns.find((column) => {
      return column.name === partyName + '_id';
    });

    if (!party) {
      return false;
    }
  }

  return true;
};

const createColumnSelector = (columns: $ReadOnlyArray<ColumnType>, alias: ?string): string => {
  const selectorAlias = alias ? alias + '.' : '';

  return columns
    .map((column) => {
      const normalizedColumnName = camelCase(column.name);

      return column.name === normalizedColumnName ? selectorAlias + '"' + normalizedColumnName + '"' : selectorAlias + '"' + column.name + '" "' + normalizedColumnName + '"';
    })
    .join(', ');
};

// eslint-disable-next-line complexity
export default (
  columns: $ReadOnlyArray<ColumnType>,
  indexes: $ReadOnlyArray<IndexType>
): string => {
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
      // eslint-disable-next-line no-continue
      continue;
    }

    const mappedTableName = tableColumns[0].mappedTableName;

    const resouceName = upperFirst(camelCase(mappedTableName));

    if (isJoiningTable(tableName, columns)) {
      const parties = tableName.split('_');

      if (parties.length !== 2) {
        throw new Error('Unexpected state.');
      }

      const relations = [
        {
          key: parties[0],
          resource: parties[1]
        },
        {
          key: parties[1],
          resource: parties[0]
        }
      ];

      for (const relation of relations) {
        const loaderName = pluralize(relation.resource) + 'By' + upperFirst(camelCase(relation.key + '_id')) + 'Loader';

        const resourceTableColumns = columns.filter((column) => {
          return column.mappedTableName === relation.resource;
        });

        const realResourceTableName = resourceTableColumns[0].tableName;

        const tableColumnSelector = createColumnSelector(resourceTableColumns, 'r2');

        loaders.push(
          `const ${loaderName} = new DataLoader((ids) => {
  return getByIdsUsingJoiningTable(connection, '${tableName}', '${realResourceTableName}', '${relation.resource}', '${relation.key}', '${tableColumnSelector}', ids);
});`
        );

        const keyColumn = tableColumns.find((column) => {
          return column.name === relation.key + '_id';
        });

        if (!keyColumn) {
          throw new Error('Unexpected state.');
        }

        let keyType: 'number' | 'string';

        if (isNumberType(keyColumn.dataType)) {
          keyType = 'number';
        } else if (isStringType(keyColumn.dataType)) {
          keyType = 'string';
        } else {
          throw new Error('Unexpected state.');
        }

        const loaderType = '+' + loaderName + ': DataLoader<' + keyType + ', $ReadOnlyArray<' + formatTypeName(relation.resource) + '>>';

        loaderTypes.push(loaderType);

        loaderNames.push(loaderName);
      }
    }

    for (const tableColumn of tableColumns) {
      const tableColumnSelector = createColumnSelector(tableColumns);

      if (tableColumn.name.endsWith('_id')) {
        const loaderName = pluralize(resouceName) + 'By' + upperFirst(camelCase(tableColumn.name)) + 'Loader';

        loaders.push(
          `const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${tableName}', ids, '${tableColumn.name}', '${tableColumnSelector}', true);
});`
        );

        let keyType: 'number' | 'string';

        if (isNumberType(tableColumn.dataType)) {
          keyType = 'number';
        } else if (isStringType(tableColumn.dataType)) {
          keyType = 'string';
        } else {
          throw new Error('Unexpected state.');
        }

        const loaderType = '+' + loaderName + ': DataLoader<' + keyType + ', $ReadOnlyArray<' + formatTypeName(tableColumn.mappedTableName) + '>>';

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

      loaders.push(
        `const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${tableName}', ids, '${indexColumn.name}', '${tableColumnSelector}', false, NotFoundError);
});`
      );

      let keyType: 'number' | 'string';

      if (isNumberType(indexColumn.dataType)) {
        keyType = 'number';
      } else if (isStringType(indexColumn.dataType)) {
        keyType = 'string';
      } else {
        throw new Error('Unexpected state.');
      }

      const loaderType = '+' + loaderName + ': DataLoader<' + keyType + ', ' + formatTypeName(indexColumn.mappedTableName) + '>';

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
  getByIdsUsingJoiningTable
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'slonik';
${generateFlowTypeDocument(columns)}

export type LoadersType = {|
${loaderTypes.map((body) => {
    return indent(body, 2);
  }).join(',\n')}
|};

export const createLoaders = (connection: DatabaseConnectionType, NotFoundError: Class<Error>): LoadersType => {
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
