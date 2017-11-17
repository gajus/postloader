// @flow

import {
  sortBy
} from 'lodash';
import type {
  ColumnType
} from '../../types';
import formatTypeName from '../formatTypeName';
import formatPropertyName from '../formatPropertyName';
import getFlowType from './getFlowType';

const generateFlowTypeDeclarationBody = (columns: $ReadOnlyArray<ColumnType>): string => {
  const sortedColumns = sortBy(columns, 'column_name');

  const propertyDeclarations = [];

  for (const column of sortedColumns) {
    propertyDeclarations.push('+' + formatPropertyName(column.name) + ': ' + getFlowType(column.dataType) + (column.isNullable ? ' | null' : ''));
  }

  return propertyDeclarations.join('\n');
};

export default (
  columns: $ReadOnlyArray<ColumnType>
): string => {
  const tableNames = columns
    .map((column) => {
      return column.mappedTableName;
    })
    .filter((tableName, index, self) => {
      return self.indexOf(tableName) === index;
    });

  const typeDeclarations = [];

  for (const tableName of tableNames) {
    const tableColumns = columns.filter((column) => {
      return column.mappedTableName === tableName;
    });

    const typeName = formatTypeName(tableName);

    // @todo Use indent.

    const typeDeclaration = `
type ${typeName} = {|
  ${generateFlowTypeDeclarationBody(tableColumns).split('\n').join(',\n  ')}
|};`;

    typeDeclarations.push(typeDeclaration);
  }

  return typeDeclarations.join('\n') + `\n
export type {
  ${tableNames.map((tableName) => {
    return formatTypeName(tableName);
  }).join(',\n  ')}
};`;
};
