import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from '@testpossessed/ts-substitute';

import { IUtility } from '../../abstractions/utlity.interface';
import { defaultSettings } from '../../default-settings';
import { StatementDetails } from '../../models/statement-details';
import { ExportStatementBuilder } from '../../export-statement-builder';
import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';

describe('ExportStatementBuilder', () => {
  let utility: SubstituteOf<IUtility>;
  let vsCodeApi: SubstituteOf<IVsCodeApi>;
  let target: ExportStatementBuilder;

  beforeEach(() => {
    utility = Substitute.for<IUtility>();
    vsCodeApi = Substitute.for<IVsCodeApi>();
    target = new ExportStatementBuilder(utility, vsCodeApi);
  });

  it('should be defined', () => {
    assert.isDefined(target);
  });

  it('should implement a method to build a statement', () => {
    assert.isFunction(target.build);
    assert.equal(target.build.length, 2);
  });

  it('should build correct statement when no default and not using import alias pattern', async () => {
    assumeDefaultConfiguration();
    utility.containsDefaultExport(Arg.any()).returnsAsync(false);
    const expected: StatementDetails = {
      // tslint:disable-next-line: quotemark
      statement: "export * from './test1';",
      alias: undefined,
      isBarrelImport: false,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement for nested barrel file when no default and not using import alias pattern', async () => {
    assumeDefaultConfiguration();
    utility.containsDefaultExport(Arg.any()).returnsAsync(false);
    const expected: StatementDetails = {
      // tslint:disable-next-line: quotemark
      statement: "export * from './sub';",
      alias: undefined,
      isBarrelImport: true,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/sub/index.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement when file uses default export', async () => {
    assumeDefaultConfiguration();

    const alias = 'Test1';
    utility.buildAlias(Arg.any()).returns(alias);
    utility.containsDefaultExport(Arg.any()).returnsAsync(true);

    const expected: StatementDetails = {
      statement: `export { default as test1 } from \'./test1\';`,
      alias: undefined,
      isBarrelImport: false,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement for nested barrel file when file uses default export', async () => {
    assumeDefaultConfiguration();

    utility.containsDefaultExport(Arg.any()).returnsAsync(true);

    const expected: StatementDetails = {
      statement: `export { default as sub } from \'./sub\';`,
      alias: undefined,
      isBarrelImport: true,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/sub/index.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement when import alias export pattern enabled', async () => {
    vsCodeApi.getConfiguration().returns({
      ...defaultSettings,
      useImportAliasExportPattern: true,
    });

    const alias = 'Test1';
    utility.buildAlias(Arg.any()).returns(alias);

    const expected: StatementDetails = {
      statement: `import * as ${alias} from \'./test1\';`,
      alias,
      isBarrelImport: false,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement for nested barrel file when import alias export pattern enabled', async () => {
    vsCodeApi.getConfiguration().returns({
      ...defaultSettings,
      useImportAliasExportPattern: true,
    });

    const alias = 'Sub';
    utility.buildAlias(Arg.any()).returns(alias);

    const expected: StatementDetails = {
      statement: `import * as ${alias} from \'./sub\';`,
      alias,
      isBarrelImport: true,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/sub/index.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement for vue file when include extension on export contains .vue', async () => {
    assumeDefaultConfiguration();
    utility.containsDefaultExport(Arg.any()).returnsAsync(false);
    const expected: StatementDetails = {
      // tslint:disable-next-line: quotemark
      statement: "export * from './test1.vue';",
      alias: undefined,
      isBarrelImport: false,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.vue');

    assert.deepEqual(actual, expected);
  });
  
  it('should build correct statement when exclude semi colon at end of line setting enabled', async () => {
    vsCodeApi.getConfiguration().returns({
      ...defaultSettings,
      excludeSemiColonAtEndOfLine: true,
    });

    utility.containsDefaultExport(Arg.any()).returnsAsync(false);
    const expected: StatementDetails = {
      // tslint:disable-next-line: quotemark
      statement: "export * from './test1'",
      alias: undefined,
      isBarrelImport: false,
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    assert.deepEqual(actual, expected);
  });

  it('should correct quote character when double selected for quote style', async () => {
    vsCodeApi.getConfiguration().returns({
      ...defaultSettings,
      quoteStyle: 'Double',
    });

    utility.containsDefaultExport(Arg.any()).returnsAsync(false);

    const expected: StatementDetails = {
      statement: 'export * from "./test1";',
      alias: undefined,
      isBarrelImport: false
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    console.log(actual);

    assert.deepEqual(actual, expected);
  });

  function assumeDefaultConfiguration() {
    vsCodeApi.getConfiguration().returns(defaultSettings);
  }
});
