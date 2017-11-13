// @flow

import {
  sql
} from 'slonik';
import type {
  ColumnType,
  DatabaseConnectionType
} from '../types';

export default async (connection: DatabaseConnectionType): Promise<$ReadOnlyArray<ColumnType>> => {
  return connection.any(sql`
    SELECT
      pc1.relname "tableName",
      pa1.attnum,
      pa1.attname "name",
      pd1.description "comment",
      pg_catalog.format_type (pa1.atttypid, NULL) "dataType",
      pc1.relkind = 'm' "isMaterializedView",
      NOT(pa1.attnotnull) "isNullable"
    FROM
      pg_class pc1
    INNER JOIN pg_namespace pn1 ON pn1.oid = pc1.relnamespace
    INNER JOIN
      pg_attribute pa1 ON pa1.attrelid = pc1.oid
      AND pa1.attnum > 0
      AND NOT pa1.attisdropped
    LEFT JOIN pg_description pd1 ON pd1.objoid = pa1.attrelid AND pd1.objsubid = pa1.attnum
    WHERE
      pn1.nspname = 'public' AND
      pc1.relkind IN ('r', 'm')
    ORDER BY
      pc1.relname ASC,
      pa1.attnum ASC
  `);
};
