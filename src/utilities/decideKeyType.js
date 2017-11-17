// @flow

import type {
  ColumnType
} from '../types';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

export default (keyColumn: ColumnType) => {
  let keyType: 'number' | 'string';

  if (isNumberType(keyColumn.dataType)) {
    keyType = 'number';
  } else if (isStringType(keyColumn.dataType)) {
    keyType = 'string';
  } else {
    throw new Error('Unexpected state.');
  }

  return keyType;
};

