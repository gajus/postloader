// @flow

import type {
  ColumnType,
} from '../../src/types';

export const createColumn = (columns: any): ColumnType => {
  return columns;
};

export const createColumnWithName = (columnName: string): ColumnType => {
  return createColumn({
    name: columnName,
  });
};
