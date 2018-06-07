// @flow

import {
  sortBy
} from 'lodash';
import type {
  ColumnType,
  DataTypeMapType
} from '../types';
import getFlowType from './getFlowType';
import formatTypeName from './formatTypeName';
import formatPropertyName from './formatPropertyName';

const generateFlowTypeDeclarationBody = (columns: $ReadOnlyArray<ColumnType>, dataTypeMap: DataTypeMapType = {}): string => {
  const sortedColumns = sortBy(columns, 'column_name');

  const propertyDeclarations = [];

  for (const column of sortedColumns) {
    const propertyDataType = dataTypeMap[column.dataType] ? dataTypeMap[column.dataType] : getFlowType(column.dataType);

    propertyDeclarations.push('+' + formatPropertyName(column.name) + ': ' + propertyDataType + (column.isNullable ? ' | null' : ''));
  }

  return propertyDeclarations.join('\n');
};

export default (columns: $ReadOnlyArray<ColumnType>, dataTypeMap: DataTypeMapType = {}): string => {
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
  ${generateFlowTypeDeclarationBody(tableColumns, dataTypeMap).split('\n').join(',\n  ')}
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
