// @flow

import pluralize from 'pluralize';

export default (tableName: string): string => {
  return pluralize(tableName.split('_').join(' ')).split(' ').join('_');
};
