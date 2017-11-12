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
    const tableColumns = columns.filter((column) => {
      return column.tableName === tableName;
    });

    if (tableColumns.length === 0) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const mappedTableName = tableColumns[0].mappedTableName;

    const resouceName = upperFirst(camelCase(mappedTableName));

    const idColumns = tableColumns.filter((column) => {
      return column.name === 'id' || column.name.endsWith('_id');
    });

    const tableColumnSelector = tableColumns
      .map((column) => {
        const normalizedColumnName = camelCase(column.name);

        return column.name === normalizedColumnName ? '"' + normalizedColumnName + '"' : '"' + column.name + '" "' + normalizedColumnName + '"';
      })
      .join(', ');

    for (const idColumn of idColumns) {
      const loaderName = resouceName + 'By' + upperFirst(camelCase(idColumn.name)) + 'Loader';

      loaders.push(
        `
const ${loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${idColumn.tableName}', ids, '${idColumn.name}', '${tableColumnSelector}');
});`
      );

      const keyType = isNumberType(idColumn.dataType) ? 'number' : 'string';

      const loaderType = '+' + loaderName + ': DataLoader<' + keyType + ', ' + formatTypeName(idColumn.mappedTableName) + '>';

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
