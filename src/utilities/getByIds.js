// @flow

import {
  camelCase
} from 'lodash';
import Logger from '../Logger';
import type {
  DatabaseConnectionType
} from '../types';

const log = Logger.child({
  namespace: 'getByIds'
});

export default async (
  connection: DatabaseConnectionType,
  tableName: string,
  ids: $ReadOnlyArray<string | number>,
  idName: string = 'id',
  columnSelector: string,
  resultIsArray: boolean,
  NotFoundError: Class<Error>
): Promise<$ReadOnlyArray<any>> => {
  let rows = [];

  if (ids.length > 0) {
    rows = await connection.any('SELECT ' + columnSelector + ' FROM "' + tableName + '" WHERE ' + idName + ' IN ?', [
      ids
    ]);
  }

  const results = [];

  const targetPropertyName = camelCase(idName);

  if (resultIsArray) {
    for (const id of ids) {
      const result = rows.filter((row) => {
        return row[targetPropertyName] === id;
      });

      results.push(result);
    }
  } else {
    for (const id of ids) {
      let result = rows.find((row) => {
        return row[targetPropertyName] === id;
      });

      if (!result) {
        log.warn({
          id,
          idName,
          tableName
        }, 'resource not found');

        result = new NotFoundError();
      }

      results.push(result);
    }
  }

  return results;
};
