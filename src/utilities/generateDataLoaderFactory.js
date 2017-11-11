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

export default (
  columns: $ReadOnlyArray<ColumnType>,

  // @todo Use indexes to identify unique constraints
  // eslint-disable-next-line no-unused-vars
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
    const resouceName = upperFirst(camelCase(tableName));
    const tableColumns = columns.filter((column) => {
      return column.tableName === tableName;
    });

    const idColumns = tableColumns.filter((column) => {
      return column.columnName === 'id' || column.columnName.endsWith('_id');
    });

    const tableColumnSelector = tableColumns
      .map((column) => {
        const normalizedColumnName = camelCase(column.columnName);

        return column.columnName === normalizedColumnName ? '"' + normalizedColumnName + '"' : '"' + column.columnName + '" "' + normalizedColumnName + '"';
      })
      .join(', ');

    for (const idColumn of idColumns) {
      const loaderName = resouceName + 'By' + upperFirst(camelCase(idColumn.columnName)) + 'Loader';

      loaders.push(
        `
const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${idColumn.tableName}', ids, '${idColumn.columnName}', '${tableColumnSelector}');
});`
      );

      const keyType = isNumberType(idColumn.dataType) ? 'number' : 'string';

      const loaderType = '+' + loaderName + ': DataLoader<' + keyType + ', ' + formatTypeName(idColumn.tableName) + '>';

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

export const createLoaders = (connection: DatabaseConnectionType) => {
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
