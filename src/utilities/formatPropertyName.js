// @flow

import {
  camelCase,
} from 'lodash';

export default (columnName: string): string => {
  return camelCase(columnName);
};
