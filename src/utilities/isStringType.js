// @flow

/**
 * @see https://www.postgresql.org/docs/current/static/datatype-numeric.html
 */
const characterTypeRule = /^(?:text|character|coordinates)(\s|$)/;

export default (databaseTypeName: string): boolean => {
  return characterTypeRule.test(databaseTypeName);
};
