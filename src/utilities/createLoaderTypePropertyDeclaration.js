// @flow

import formatTypeName from './formatTypeName';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

export default (loaderName: string, dataTypeName: string, resourceName: string, resultIsArray: boolean) => {
  let keyType: 'number' | 'string';

  if (isNumberType(dataTypeName)) {
    keyType = 'number';
  } else if (isStringType(dataTypeName)) {
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
