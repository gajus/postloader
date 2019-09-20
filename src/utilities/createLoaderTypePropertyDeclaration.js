// @flow

import Logger from '../Logger';
import formatTypeName from './formatTypeName';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

const log = Logger.child({
  namespace: 'createLoaderTypePropertyDeclaration',
});

export default (loaderName: string, dataTypeName: string, resourceName: string, resultIsArray: boolean) => {
  let keyType: 'number' | 'string';

  if (isNumberType(dataTypeName)) {
    keyType = 'number';
  } else if (isStringType(dataTypeName)) {
    keyType = 'string';
  } else {
    log.error({
      dataTypeName,
      loaderName,
      resourceName,
      resultIsArray,
    }, 'key type cannot be resolved to a string or number');

    throw new Error('Cannot resolve key type.');
  }

  if (resultIsArray) {
    return '+' + loaderName + ': DataLoader<' + keyType + ', $ReadOnlyArray<' + formatTypeName(resourceName) + '>>';
  } else {
    return '+' + loaderName + ': DataLoader<' + keyType + ', ' + formatTypeName(resourceName) + '>';
  }
};
