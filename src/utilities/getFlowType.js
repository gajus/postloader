// @flow

import {
  createDebug
} from '../factories';
import isNumberType from './isNumberType';
import isStringType from './isStringType';

const debug = createDebug('mapFlowType');

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

  debug('unknown type', databaseTypeName);

  return 'any';
};
