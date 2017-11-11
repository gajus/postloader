// @flow

import {
  camelCase,
  upperFirst
} from 'lodash';

export default (
  tableName: string
): string => {
  return upperFirst(camelCase(tableName)) + 'RecordType';
};
