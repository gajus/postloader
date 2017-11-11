// @flow

import debug from 'debug';

export default (namespace: string) => {
  return debug('database-types:' + namespace);
};
