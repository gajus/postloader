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
    const propertyDataType = dataTypeMap[column.dataType] ? getFlowType(dataTypeMap[column.dataType]) : getFlowType(column.dataType);

    propertyDeclarations.push('+' + formatPropertyName(column.name) + ': ' + propertyDataType + (column.isNullable ? ' | null' : ''));
  }

  return propertyDeclarations.join('\n');
};

export default (unnormalisedColumns: $ReadOnlyArray<ColumnType>, dataTypeMap: DataTypeMapType = {}): string => {
  const columns = unnormalisedColumns
    .map((column) => {
      return {
        ...column,
        mappedTableName: column.mappedTableName || column.tableName
      };
    });

  const tableNames = columns
    .map((column) => {
      return column.mappedTableName || column.tableName;
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

    const typeDeclaration = `
type ${typeName} = {|
  ${generateFlowTypeDeclarationBody(tableColumns, dataTypeMap).split('\n').sort().join(',\n  ')}
|};`;

    typeDeclarations.push(typeDeclaration);
  }

  const exportedTypes = tableNames.map((tableName) => {
    return formatTypeName(tableName);
  })
    .sort()
    .join(',\n  ');

  return typeDeclarations.join('\n') + `\n
export type {
  ${exportedTypes}
};`;
};
