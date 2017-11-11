// @flow

import {
  createDebug
} from '../factories';
import isNumberType from './isNumberType';

const debug = createDebug('mapFlowType');

export default (databaseTypeName: string): string => {
  if (databaseTypeName === 'json') {
    return 'Object';
  }

  if (/^(?:text|character|timestamp|coordinates)(\s|$)/.test(databaseTypeName)) {
    return 'string';
  }

  if (databaseTypeName === 'boolean') {
    return 'boolean';
  }

  if (isNumberType(databaseTypeName)) {
    return 'number';
  }

  debug('unknown type', databaseTypeName);

  return 'any';
};
