// @flow

import type {
  DatabaseConnectionType
} from '../types';
import sortInOrderBy from './sortInOrderBy';

const packData = (
  rows: $ReadOnlyArray<Object>,
  ids: $ReadOnlyArray<string | number>,
  idName: string,
  NotFoundError: Class<Error>
) => {
  const packedRows = [];

  for (const id of ids) {
    let body = rows.find((row) => {
      return row[idName] === id;
    });

    if (!body) {
      body = new NotFoundError();
    }

    packedRows.push({
      body,
      [idName]: id
    });
  }

  return packedRows;
};

export default async (
  connection: DatabaseConnectionType,
  tableName: string,
  ids: $ReadOnlyArray<string | number>,
  idName: string = 'id',
  columnSelector: string,
  NotFoundError: Class<Error>
): Promise<$ReadOnlyArray<Object>> => {
  let rows = [];

  if (ids.length > 0) {
    rows = await connection.any('SELECT ' + columnSelector + ' FROM "' + tableName + '" WHERE ' + idName + ' IN ?', [
      ids
    ]);
  }

  const packedRows = packData(rows, ids, idName, NotFoundError);

  const results = sortInOrderBy(packedRows, ids, idName);

  return results.map((pack) => {
    return pack.body;
  });
};
