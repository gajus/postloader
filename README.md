# PostLoader

[![Travis build status](http://img.shields.io/travis/gajus/postloader/master.svg?style=flat-square)](https://travis-ci.org/gajus/postloader)
[![Coveralls](https://img.shields.io/coveralls/gajus/postloader.svg?style=flat-square)](https://coveralls.io/github/gajus/postloader)
[![NPM version](http://img.shields.io/npm/v/postloader.svg?style=flat-square)](https://www.npmjs.org/package/postloader)
[![Canonical Code Style](https://img.shields.io/badge/code%20style-canonical-blue.svg?style=flat-square)](https://github.com/gajus/canonical)
[![Twitter Follow](https://img.shields.io/twitter/follow/kuizinas.svg?style=social&label=Follow)](https://twitter.com/kuizinas)

A scaffolding tool for projects using [DataLoader](https://github.com/facebook/dataloader), [Flow](https://flow.org/) and [PostgreSQL](https://www.postgresql.org/).

* [Motivation](#motivation)
  * [What makes this different from using an ORM?](#what-makes-this-different-from-using-an-orm)
* [Behaviour](#behaviour)
  * [Unique key loader](#unique-key-loader)
  * [Non-unique `_id` loaders](#non-unique-id-loader)
  * [Non-unique joining table loader](#non-unique-joining-table-loader)
* [Naming conventions](#naming-conventions)
  * [Type names](#type-names)
  * [Property names](#property-names)
  * [Loader names](#loader-names)
* [Usage examples](#usage-examples)
  * [Generate DataLoader loaders for all database tables](#generate-dataloader-loaders-for-all-database-tables)
  * [Consume the generated code](#consume-the-generated-code)
  * [Handling non-nullable columns in materialized views](#handling-non-nullable-columns-in-materialized-views)

## Motivation

Keeping database and codebase in sync is hard. Whenever changes are done to the database schema, these changes need to be reflected in the codebase's type declarations.

Most of the loaders are needed to perform simple PK look ups, e.g. `UserByIdLoader`. Writing this logic for every table is a mundane task.

PostLoader solves both of these problems by:

1. Creating type declarations for all database tables.
1. Creating loaders for the most common lookups.

If you are interested to learn more, I have written an article on the subject: [I reduced GraphQL codebase size by 40% and increased type coverage to 90%+. Using code generation to create data loaders for all database resources.](https://medium.com/@gajus/i-reduced-graphql-codebase-size-by-40-and-increased-type-coverage-to-90-a2c87fdc78d3).

### What makes this different from using an ORM?

1. ORM is not going to give you strict types and code completion.
1. ORM has runtime overhead for constructing the queries and formatting the results.

## Behaviour

PostLoader is a CLI program (and a collection of utilities) used to generate code based on a PostgreSQL database schema.

The generated code consists of:

1. Flow type declarations describing every table in the database.
1. A factory function used to construct a collection of loaders.

### Unique key loader

A loader is created for every column in a unique index ([unique indexes including multiple columns are not supported](https://github.com/gajus/postloader/issues/1)), e.g. `UserByIdLoader`.

### Non-unique `_id` loader

A loader is created for every column that has name ending with `_id`.

A non-unique loader is used to return multiple rows per lookup, e.g. `CitiesByCountryIdLoader`. The underlying data in this example comes from a table named "city". PostLoader is using [`pluralize`](https://www.npmjs.com/package/pluralize) module to pluralize the table name.

### Non-unique joining table loader

A loader is created for every resource discoverable via a joining table.

1. A joining table consists of at least 2 columns that have names ending `_id`.
1. The table name is a concatenation of the column names (without `_id` suffix) (in alphabetical order, i.e. `genre_movie`, not `movie_genre`).

#### Example

Assume a many-to-many relationship of movies and genres:

```sql
CREATE TABLE movie (
  id integer NOT NULL,
  name text
);

CREATE TABLE venue (
  id integer NOT NULL,
  name text
);

CREATE TABLE genre_movie (
  id integer NOT NULL,
  genre_id integer NOT NULL,
  movie_id integer NOT NULL
);

```

Provided the above schema, PostLoader will create two non-unique loaders:

* `MoviesByGenreIdLoader`
* `GenresByMovieIdLoader`

## Naming conventions

### Type names

Type names are created from table names.

Table name is camel cased, the first letter is uppercased and suffixed with "RecordType", e.g. "movie_rating" becomes `MovieRatingRecordType`.

### Property names

Property names of type declarations are derived from the respective table column names.

Column names are camel cased, e.g. "first_name" becomes `firstName`.

### Loader names

Loader names are created from table names and column names.

Table name is camel cased, the first letter is uppercased, suffixed with "By" constant, followed by the name of the property (camel cased, the first letter is uppercased) used to load the resource, followed by "Loader" constant, e.g. a record from "user" table with "id" column can be loaded using `UserByIdLoader` loader.

## Usage examples

### Generate DataLoader loaders for all database tables

```bash
export POSTLOADER_DATABASE_CONNECTION_URI=postgres://postgres:password@127.0.0.1/test
export POSTLOADER_COLUMN_FILTER="return /* exclude tables that have a _view */ !columns.map(column => column.tableName).includes(tableName + '_view')"
export POSTLOADER_TABLE_NAME_MAPPER="return tableName.endsWith('_view') ? tableName.slice(0, -5) : tableName;"
export POSTLOADER_DATA_TYPE_MAP="{\"email\":\"text\"}"

postloader generate-loaders > ./PostLoader.js

```

This generates a file containing a factory function used to construct a DataLoader for every table in the database and Flow type declarations in the following format:

```js
// @flow

import {
  getByIds,
  getByIdsUsingJoiningTable
} from 'postloader';
import DataLoader from 'dataloader';
import type {
  DatabaseConnectionType
} from 'slonik';

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
  +UsersByAffiliateIdLoader: DataLoader<number, $ReadOnlyArray<UserRecordType>>,
  // [..]
|};

// [..]

export const createLoaders = (connection: DatabaseConnectionType, NotFoundError: Error) => {
  const UserByIdLoader = new DataLoader((ids) => {
    return getByIds(connection, 'user', ids, 'id', '"id", "email", "given_name" "givenName", "family_name" "familyName", "password", "created_at" "createdAt", "updated_at" "updatedAt", "pseudonym"', false, NotFoundError);
  });
  const UsersByAffiliateIdLoader = new DataLoader((ids) => {
    return getByIdsUsingJoiningTable(connection, 'affiliate_user', 'user', 'user', 'affiliate', 'r2."id", r2."email", r2."given_name" "givenName", r2."family_name" "familyName", r2."password", r2."created_at" "createdAt", r2."updated_at" "updatedAt", r2."pseudonym"', ids);
  });

  // [..]

  return {
    UserByIdLoader,
    UsersByAffiliateIdLoader,
    // [..]
  };
};


```

### Consume the generated code

1. Dump the generated code to a file in your project tree, e.g. `/generated/PostLoader.js`.
1. Create PostgreSQL connection resource using [Slonik](https://github.com/gajus/slonik).
1. Import `createLoaders` factory function from the generated file.
1. Create the loaders collections.
1. Consume the loaders.

Example:

```js
// @flow

import {
  createConnection
} from 'slonik';
import {
  createLoaders
} from './generated/PostLoader';
import type {
  UserRecordType
} from './generated/PostLoader';

const connection = await createConnection({
  host: '127.0.0.1'
});

const loaders = createLoaders(connection);

const user = await loaders.UserByIdLoader.load(1);

const updateUserPassword = (user: UserRecordType, newPassword: string) => {
  // [..]
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

Alternatively, update the `pg_attribute.attnotnull` value of the target columns, e.g.

```sql
CREATE OR REPLACE FUNCTION set_attribute_not_null(view_name TEXT, column_names TEXT[])
RETURNS void AS
$$
BEGIN
  UPDATE pg_catalog.pg_attribute
  SET attnotnull = true
  WHERE attrelid IN (
    SELECT
      pa1.attrelid
    FROM pg_class pc1
    INNER JOIN pg_namespace pn1 ON pn1.oid = pc1.relnamespace
    INNER JOIN pg_attribute pa1 ON pa1.attrelid = pc1.oid AND pa1.attnum > 0 AND NOT pa1.attisdropped
    WHERE
      pn1.nspname = 'public' AND
      pc1.relkind = 'm' AND
      pc1.relname = view_name AND
      pa1.attname = ANY(column_names)
  );
END;
$$ language 'plpgsql';

set_attribute_not_null('person_view', ARRAY['id', 'imdb_id', 'tmdb_id', 'headshot_image_name', 'name']);

```
