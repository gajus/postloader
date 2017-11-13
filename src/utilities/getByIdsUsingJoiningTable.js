// @flow

import type {
  DatabaseConnectionType
} from '../types';

export default async (
  connection: DatabaseConnectionType,
  joiningTableName: string,
  targetResourceTableName: string,
  joiningKeyName: string,
  lookupKeyName: string,
  columnSelector: string,
  ids: $ReadOnlyArray<string | number>
): Promise<$ReadOnlyArray<any>> => {
  let rows = [];

  if (ids.length > 0) {
    rows = await connection.any(`
      SELECT r1.${lookupKeyName}_id "POSTLOADER_LOOKUP_KEY", ${columnSelector}
      FROM ${joiningTableName} r1
      INNER JOIN ${targetResourceTableName} r2 ON r2.id = r1.${joiningKeyName}_id
      WHERE r2.${lookupKeyName}_id IN ?
    `, [
      ids
    ]);
  }

  const results = [];

  for (const id of ids) {
    const result = rows.filter((row) => {
      return row.POSTLOADER_LOOKUP_KEY === id;
    });

    results.push(result);
  }

  return results;
};
