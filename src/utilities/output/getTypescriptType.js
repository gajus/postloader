// @flow

import Logger from '../../Logger';
import isNumberType from './../isNumberType';
import isStringType from './../isStringType';

const log = Logger.child({
  namespace: 'getTypescriptType'
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

  log.warn({
    databaseTypeName
  }, 'unknown type');

  return 'any';
};
