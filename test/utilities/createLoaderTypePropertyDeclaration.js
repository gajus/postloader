// @flow

import test from 'ava';
import createLoaderTypePropertyDeclaration from '../../src/utilities/createLoaderTypePropertyDeclaration';

test('generates loader type property declaration', (t) => {
  t.true(createLoaderTypePropertyDeclaration('FooLoader', 'text', 'foo', false) === '+FooLoader: DataLoader<string, FooRecordType>');
  t.true(createLoaderTypePropertyDeclaration('FooLoader', 'integer', 'foo', false) === '+FooLoader: DataLoader<number, FooRecordType>');
});

test('generates loader type property declaration (array)', (t) => {
  t.true(createLoaderTypePropertyDeclaration('FooLoader', 'text', 'foo', true) === '+FooLoader: DataLoader<string, $ReadOnlyArray<FooRecordType>>');
  t.true(createLoaderTypePropertyDeclaration('FooLoader', 'integer', 'foo', true) === '+FooLoader: DataLoader<number, $ReadOnlyArray<FooRecordType>>');
});

test('throws an error if data type cannot resolve to a string or number', (t) => {
  t.throws((): void => {
    createLoaderTypePropertyDeclaration('FooLoader', 'unknown', 'foo', false);
  }, 'Cannot resolve key type.');
});
