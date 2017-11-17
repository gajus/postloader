// @flow

import type {OutputType, Loader, StandardLoaderConfigType, ThruLoaderConfigType} from '../../types';
import formatTypeName from '../formatTypeName';
import decideKeyType from '../decideKeyType';

export class StandardLoader implements Loader {
  loaderName: string
  tableName: string
  keyType: string
  keyName: string
  columnSelector: string
  resultIsArray: boolean
  resourceName: string

  constructor (config: StandardLoaderConfigType) {
    this.loaderName = config.name;
    this.tableName = config.tableName;
    this.keyType = decideKeyType(config.keyColumn);
    this.keyName = config.keyColumn.name;
    this.columnSelector = config.columnSelector;
    this.resultIsArray = config.resultIsArray;
    this.resourceName = formatTypeName(config.resourceName);
  }

  definition (format: OutputType): string {
    if (format === 'flow') {
      if (this.resultIsArray) {
        return '+' + this.loaderName + ': DataLoader<' + this.keyType + ', $ReadOnlyArray<' + this.resourceName + '>>';
      } else {
        return '+' + this.loaderName + ': DataLoader<' + this.keyType + ', ' + this.resourceName + '>';
      }
    } else if (format === 'typescript') {
      if (this.resultIsArray) {
        return 'readonly ' + this.loaderName + ': DataLoader<' + this.keyType + ', ' + this.resourceName + '[]>';
      } else {
        return 'readonly ' + this.loaderName + ': DataLoader<' + this.keyType + ', ' + this.resourceName + '>';
      }
    } else {
      throw new Error('Impossible return');
    }
  }

  createLoader (format: OutputType): string {
    if (format === 'flow') {
      return `const ${this.loaderName} = new DataLoader((ids) => {
  return getByIds(connection, '${this.tableName}', ids, '${this.keyName}', '${this.columnSelector}', ${String(this.resultIsArray)}, NotFoundError);
});`;
    } else if (format === 'typescript') {
      return `const ${this.loaderName} = new DataLoader<${this.keyType}, ${this.resourceName}${this.resultIsArray ? '[]' : ''}>((ids) => {
  return getByIds(connection, '${this.tableName}', ids, '${this.keyName}', '${this.columnSelector}', ${String(this.resultIsArray)}, NotFoundError);
});`;
    } else {
      throw new Error('Impossible return');
    }
  }
}

export class ThruJoinLoader implements Loader {
  loaderName: string
  joiningTableName: string
  joiningKeyType: "string" | "number"
  joiningKeyName: string
  lookupKeyName: string
  targetTableName: string
  columnSelector: string
  resourceName: string

  constructor (config: ThruLoaderConfigType) {
    this.loaderName = config.name;
    this.joiningTableName = config.joiningTableName;
    this.targetTableName = config.targetTableName;
    this.joiningKeyType = decideKeyType(config.joiningKeyColumn);
    this.joiningKeyName = config.joiningKeyColumn.name;
    this.lookupKeyName = config.lookupKeyName;
    this.columnSelector = config.columnSelector;
    this.resourceName = formatTypeName(config.resourceName);
  }

  definition (format: OutputType): string {
    if (format === 'flow') {
      return '+' + this.loaderName + ': DataLoader<' + this.joiningKeyType + ', ' + this.resourceName + '>';
    } else if (format === 'typescript') {
      return 'readonly ' + this.loaderName + ': DataLoader<' + this.joiningKeyType + ', ' + this.resourceName + '>';
    } else {
      throw new Error('Impossible return');
    }
  }

  createLoader (format: OutputType): string {
    if (format === 'flow') {
      return `const ${this.loaderName} = new DataLoader((ids) => {
  return getByIdsUsingJoiningTable(connection, '${this.joiningTableName}', '${this.targetTableName}', '${this.joiningKeyName}', '${this.lookupKeyName}', '${this.columnSelector}', ids);
});`;
    } else if (format === 'typescript') {
      return `const ${this.loaderName} = new DataLoader<${this.joiningKeyType}, ${this.resourceName}>((ids) => {
  return getByIdsUsingJoiningTable(connection, '${this.joiningTableName}', '${this.targetTableName}', '${this.joiningKeyName}', '${this.lookupKeyName}', '${this.columnSelector}', ids);
});`;
    } else {
      throw new Error('Impossible return');
    }
  }
}
