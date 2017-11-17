// @flow

import type {ColumnType, LoadersType} from '../../types';
import indent from '../indent';
import generateTypescriptDocument from './generateTypescriptDocument';

export default (columns: $ReadOnlyArray<ColumnType>, loaders: LoadersType) => {
  return `
import {
  getByIds,
  getByIdsUsingJoiningTable
} from 'postloader';
import * as DataLoader from 'dataloader';

${generateTypescriptDocument(columns)}

export type LoadersType = {
${loaders.map((loader) => {
    return loader.definition('typescript');
  }).map(indent(2)).join(',\n')}
};

export const createLoaders = (connection, NotFoundError): LoadersType => {
${loaders.map((loader) => {
    return loader.createLoader('typescript');
  }).map(indent(2)).join('\n')
}

  return {
${ loaders.map((loader) => {
    return loader.loaderName;
  }).map(indent(4)).join(',\n')}
  };
};
`;
};
