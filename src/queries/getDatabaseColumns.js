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
      pc1.relname "tableName",
      pa1.attname "name",
      pd1.description "comment",
      pg_catalog.format_type (pa1.atttypid, NULL) "dataType",
      pc1.relkind = 'm' "isMaterializedView",
      NOT(pa1.attnotnull) "isNullable",
      EXISTS(
        SELECT 1
        FROM pg_constraint pc2
        WHERE pc2.conrelid = pc1.oid AND pc2.contype = 'f' AND pa1.attnum = ANY(pc2.confkey)
      ) "hasForeignKeyConstraint"
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
  `);
};
