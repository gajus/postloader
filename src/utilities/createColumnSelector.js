// @flow

import {
  camelCase,
} from 'lodash';
import type {
  ColumnType,
} from '../types';

export default (columns: $ReadOnlyArray<ColumnType>, alias: ?string): string => {
  const selectorAlias = alias ? alias + '.' : '';

  return columns
    .map((column) => {
      const normalizedColumnName = camelCase(column.name);

      return column.name === normalizedColumnName ? selectorAlias + '"' + normalizedColumnName + '"' : selectorAlias + '"' + column.name + '" "' + normalizedColumnName + '"';
    })
    .join(', ');
};
