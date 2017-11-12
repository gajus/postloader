# PostLoader

[![Travis build status](http://img.shields.io/travis/gajus/postloader/master.svg?style=flat-square)](https://travis-ci.org/gajus/postloader)
[![Coveralls](https://img.shields.io/coveralls/gajus/postloader.svg?style=flat-square)](https://coveralls.io/github/gajus/postloader)
[![NPM version](http://img.shields.io/npm/v/postloader.svg?style=flat-square)](https://www.npmjs.org/package/postloader)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A scaffolding tool for projects using [DataLoader](https://github.com/facebook/dataloader), [Flow](https://flow.org/) and [PostgreSQL](https://www.postgresql.org/).

* [Usage examples](#usage-examples)
  * [Generate DataLoader loaders for all database tables](generate-dataloader-loaders-for-all-database-tables)
  * [Handling non-nullable columns in materialized views](handling-non-nullable-columns-in-materialized-views)

## Usage examples

### Generate DataLoader loaders for all database tables

```bash
export POSTLOADER_DATABASE_CONNECTION_URI=postgres://postgres:password@127.0.0.1/test
export POSTLOADER_COLUMN_FILTER="return /* exclude tables that have a _view */ !columns.map(column => column.tableName).includes(tableName + '_view')"
export POSTLOADER_TABLE_NAME_MAPPER="return tableName.endsWith('_view') ? tableName.slice(0, -5) : tableName;"

postloader generate-loaders > ./PostLoader.js

```

This generates a file containing a factory function used to construct a DataLoader for every table in the database and Flow type declarations in the following format:

```js
// @flow

import {
  getByIds
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'mightyql';

export type UserRecordType = {|
  +id: number,
  +email: string,
  +givenName: string | null,
  +familyName: string | null,
  +password: string,
  +createdAt: string,
  +updatedAt: string | null,
  +pseudonym: string
|};

// [..]

export type LoadersType = {|
  +UserByIdLoader: DataLoader<number, UserRecordType>,
|};

// [..]

export const createLoaders = (connection: DatabaseConnectionType) => {
  const UserByIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'user', ids, 'id', '"id", "email", "given_name" "givenName", "family_name" "familyName", "password", "created_at" "createdAt", "updated_at" "updatedAt", "pseudonym"');
  });

  // [..]

  return {
    UserByIdLoader,
    // [..]
  };
};


```

### Handling non-nullable columns in materialized views

Unfortunately, PostgreSQL does not describe materilized view columns as non-nullable even when you add a constraint that enforce this contract ([see this Stack Overflow question](https://stackoverflow.com/q/47242219/368691)).

For materialied views, you need to explicitly identify which collumns are non-nullable. This can be done by adding `POSTLOAD_NOTNULL` comment to the column, e.g.

```sql
COMMENT ON COLUMN user.id IS 'POSTLOAD_NOTNULL';
COMMENT ON COLUMN user.email IS 'POSTLOAD_NOTNULL';
COMMENT ON COLUMN user.password IS 'POSTLOAD_NOTNULL';
COMMENT ON COLUMN user.created_at IS 'POSTLOAD_NOTNULL';
COMMENT ON COLUMN user.pseudonym IS 'POSTLOAD_NOTNULL';

```
