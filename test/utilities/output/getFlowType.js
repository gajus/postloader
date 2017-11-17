// @flow

import test from 'ava';
import getFlowType from '../../../src/utilities/output/getFlowType';

const knownTypes = {
  bigint: 'number',
  boolean: 'boolean',
  character: 'string',
  coordinates: 'string',
  integer: 'number',
  json: 'Object',
  text: 'string',
  timestamp: 'number'
};

test('correctly maps known types', (t) => {
  const databaseTypeNames = Object.keys(knownTypes);

  for (const databaseTypeName of databaseTypeNames) {
    const flowType = knownTypes[databaseTypeName];

    if (typeof flowType !== 'string') {
      throw new TypeError();
    }

    t.true(getFlowType(databaseTypeName) === flowType, flowType);
  }
});
