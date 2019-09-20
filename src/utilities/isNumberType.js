// @flow

/**
 * @see https://www.postgresql.org/docs/current/static/datatype-numeric.html
 */
const numericTypes = [
  'bigint',
  'bigserial',
  'decimal',
  'double precision',
  'integer',
  'numeric',
  'real',
  'serial',
  'smallint',
  'timestamp with time zone',
  'timestamp',
];

export default (databaseTypeName: string): boolean => {
  return numericTypes.includes(databaseTypeName);
};
