// @flow

import type {
  ColumnType
} from '../types';

export default (tableName: string, columns: $ReadOnlyArray<ColumnType>): boolean => {
  const firstIdColumnNames = columns
    .map((column) => {
      return column.name;
    })
    .filter((columnName) => {
      return columnName.endsWith('_id');
    })
    .map((columnName) => {
      return columnName.slice(0, -3);
    })
    .slice(0, 2)
    .sort();

  if (firstIdColumnNames.length < 2) {
    return false;
  }

  return firstIdColumnNames.join('_') === tableName;
};
