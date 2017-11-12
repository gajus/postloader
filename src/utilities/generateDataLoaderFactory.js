// @flow

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

const createColumnSelector = (columns: $ReadOnlyArray<ColumnType>): string => {
  return columns
    .map((column) => {
      const normalizedColumnName = camelCase(column.name);

      return column.name === normalizedColumnName ? '"' + normalizedColumnName + '"' : '"' + column.name + '" "' + normalizedColumnName + '"';
    })
    .join(', ');
};

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

    const tableColumnSelector = createColumnSelector(tableColumns);

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

      const indexPropertyName = upperFirst(camelCase(indexColumn.name));

      const loaderName = resouceName + 'By' + indexPropertyName + 'Loader';

      loaders.push(
        `
const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${tableName}', ids, '${indexColumn.name}', '${tableColumnSelector}');
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
  getByIds
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'mightyql';
${generateFlowTypeDocument(columns)}

export type LoadersType = {|
${loaderTypes.map((body) => {
    return indent(body, 2);
  }).join(',\n')}
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
};

`;
};
