// @flow

import {
  sql,
} from 'slonik';
import {
  raw,
} from 'slonik-sql-tag-raw';
import {
  filter,
} from 'inline-loops.macro';
import type {
  DatabaseConnectionType,
} from '../types';

export default async (
  connection: DatabaseConnectionType,
  joiningTableName: string,
  targetResourceTableName: string,
  joiningKeyName: string,
  lookupKeyName: string,
  identifiers: string,
  ids: $ReadOnlyArray<string | number>,
): Promise<$ReadOnlyArray<any>> => {
  let rows = [];

  // @todo Do not use slonik-sql-tag-raw.

  if (ids.length > 0) {
    rows = await connection.any(sql`
      SELECT
        ${sql.identifier(['r1', lookupKeyName + '_id'])} "POSTLOADER_LOOKUP_KEY",
        ${raw(identifiers)}
      FROM ${sql.identifier([joiningTableName])} r1
      INNER JOIN ${sql.identifier([targetResourceTableName])} r2 ON r2.id = ${sql.identifier(['r1', joiningKeyName + '_id'])}
      WHERE ${sql.identifier(['r1', lookupKeyName + '_id'])} = ANY(${sql.array(ids, 'int4')})
    `);
  }

  const results = [];

  for (const id of ids) {
    const result = filter(rows, (row) => {
      return row.POSTLOADER_LOOKUP_KEY === id;
    });

    results.push(result);
  }

  return results;
};
