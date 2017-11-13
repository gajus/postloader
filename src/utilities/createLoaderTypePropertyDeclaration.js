// @flow

import type {
  ColumnType
} from '../types';
import formatTypeName from './formatTypeName';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

export default (loaderName: string, keyColumn: ColumnType, resourceName: string, resultIsArray: boolean) => {
  let keyType: 'number' | 'string';

  if (isNumberType(keyColumn.dataType)) {
    keyType = 'number';
  } else if (isStringType(keyColumn.dataType)) {
    keyType = 'string';
  } else {
    throw new Error('Unexpected state.');
  }

  if (resultIsArray) {
    return '+' + loaderName + ': DataLoader<' + keyType + ', $ReadOnlyArray<' + formatTypeName(resourceName) + '>>';
  } else {
    return '+' + loaderName + ': DataLoader<' + keyType + ', ' + formatTypeName(resourceName) + '>';
  }
};
