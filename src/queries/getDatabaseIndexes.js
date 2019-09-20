// @flow

import {
  sql,
} from 'slonik';
import type {
  DatabaseConnectionType,
  IndexType,
} from '../types';

export default async (connection: DatabaseConnectionType): Promise<$ReadOnlyArray<IndexType>> => {
  return connection.any(sql`
    SELECT
      c1.relname "tableName",
      c2.relname "indexName",
      i1.indisunique "indexIsUnique",
      array_agg(a1.attname)::text[] "columnNames"
    FROM
      pg_class c1,
      pg_class c2,
      pg_index i1,
      pg_attribute a1
    WHERE
      c1.oid = i1.indrelid
      AND c2.oid = i1.indexrelid
      AND a1.attrelid = c1.oid
      AND a1.attnum = ANY(i1.indkey)
      AND c1.relkind IN ('r', 'm')
    GROUP BY
      c1.relname,
      c2.relname,
      i1.indisunique
    ORDER BY
      c1.relname,
      c2.relname
  `);
};
