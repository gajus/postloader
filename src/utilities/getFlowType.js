// @flow

import Logger from '../Logger';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

const log = Logger.child({
  namespace: 'getFlowType',
});

export default (databaseTypeName: string): string => {
  if (databaseTypeName === 'json') {
    return 'Object';
  }

  if (databaseTypeName === 'boolean') {
    return 'boolean';
  }

  if (isStringType(databaseTypeName)) {
    return 'string';
  }

  if (isNumberType(databaseTypeName)) {
    return 'number';
  }

  if (databaseTypeName === 'json' || databaseTypeName === 'jsonb') {
    return 'Object';
  }

  log.warn({
    databaseTypeName,
  }, 'unknown type');

  return 'any';
};
