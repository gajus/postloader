// @flow

import type {
  ColumnType
} from '../src/types';

export const createColumnWithName = (columnName: string): ColumnType => {
  // eslint-disable-next-line no-extra-parens
  return ({
    name: columnName
  }: any);
};
