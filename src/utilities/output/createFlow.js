// @flow
import indent from '../indent';
import type {ColumnType, LoadersType} from '../../types';
import generateFlowTypeDocument from './generateFlowTypeDocument';

export default (columns: $ReadOnlyArray<ColumnType>, loaders: LoadersType) => {
  return `
// @flow

import {
  getByIds,
  getByIdsUsingJoiningTable
} from 'postloader';
import type {
  DatabaseConnectionType
} from 'slonik';
import DataLoader from 'dataloader';

${generateFlowTypeDocument(columns)}

export type LoadersType = {
${ loaders.map((loader) => {
    return loader.definition('flow');
  }).map(indent(2)).join(',\n')}
};

export const createLoaders = (connection: DatabaseConnectionType, NotFoundError: Class<Error>): LoadersType => {
${loaders.map((loader) => {
    return loader.createLoader('flow');
  })
    .map(indent(2))
    .join('\n')
}

  return {
${ loaders.map((loader) => {
    return loader.loaderName;
  }).map(indent(4)).join(',\n')}
  };
};
`;
};
