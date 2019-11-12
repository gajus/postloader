// @flow

import {
  sql,
} from 'slonik';
import {
  raw,
} from 'slonik-sql-tag-raw';
import {
  camelCase,
} from 'lodash';
import {
  filter,
  find,
} from 'inline-loops.macro';
import Logger from '../Logger';
import {
  NotFoundError,
} from '../errors';
import type {
  DatabaseConnectionType,
} from '../types';

const log = Logger.child({
  namespace: 'getByIds',
});

export default async (
  connection: DatabaseConnectionType,
  tableName: string,
  ids: $ReadOnlyArray<string | number>,
  idName: string = 'id',
  identifiers: string,
  resultIsArray: boolean,
): Promise<$ReadOnlyArray<any>> => {
  let rows = [];

  if (ids.length > 0) {
    const idType = typeof ids[0] === 'number' ? 'int4' : 'text';

    // @todo Do not use slonik-sql-tag-raw.

    rows = await connection.any(sql`
      SELECT ${raw(identifiers)}
      FROM ${sql.identifier([tableName])}
      WHERE ${sql.identifier([idName])} = ANY(${sql.array(ids, idType)})
    `);
  }

  const results = [];

  const targetPropertyName = camelCase(idName);

  if (resultIsArray) {
    for (const id of ids) {
      const result = filter(rows, (row) => {
        return row[targetPropertyName] === id;
      });

      results.push(result);
    }
  } else {
    for (const id of ids) {
      let result = find(rows, (row) => {
        return row[targetPropertyName] === id;
      });

      if (!result) {
        log.warn({
          id,
          idName,
          tableName,
        }, 'resource not found');

        result = new NotFoundError();
      }

      results.push(result);
    }
  }

  return results;
};
