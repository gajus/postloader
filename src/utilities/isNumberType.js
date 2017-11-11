// @flow

/**
 * @see https://www.postgresql.org/docs/current/static/datatype-numeric.html
 */
const numericTypes = [
  'smallint',
  'integer',
  'bigint',
  'decimal',
  'numeric',
  'real',
  'double precision',
  'serial',
  'bigserial'
];

export default (databaseTypeName: string): boolean => {
  return numericTypes.includes(databaseTypeName);
};
