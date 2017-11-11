// @flow

import {
  sql
} from 'mightyql';
import type {
  ColumnType,
  DatabaseConnectionType
} from '../types';

export default async (connection: DatabaseConnectionType): Promise<$ReadOnlyArray<ColumnType>> => {
  return connection.any(sql`
    SELECT
      pc1.relname AS "tableName",
      pa1.attname AS "columnName",
      pg_catalog.format_type (pa1.atttypid, NULL) "dataType",
      pc1.relkind = 'm' "isMaterializedView",
      NOT(pa1.attnotnull) "isNullable"
    FROM
      pg_class pc1
    JOIN pg_namespace pn1 ON pn1.oid = pc1.relnamespace
    JOIN
      pg_attribute pa1 ON pa1.attrelid = pc1.oid
      AND pa1.attnum > 0
      AND NOT pa1.attisdropped
    WHERE
      pn1.nspname = 'public' AND
      pc1.relkind IN ('r', 'm')
  `);
};
