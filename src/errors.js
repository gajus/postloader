// @flow

/* eslint-disable fp/no-class, fp/no-this */

import ExtendableError from 'es6-error';

export class PostLoaderError extends ExtendableError {}

export class NotFoundError extends PostLoaderError {}

export class UnexpectedStateError extends PostLoaderError {}
