import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from '@testpossessed/ts-substitute';

import { IUtility } from '../../abstractions/utlity.interface';
import { IConfiguration } from '../../abstractions/configuration.interface';
import { defaultSettings } from '../../default-settings';
import { StatementDetails } from '../../models/statement-details';
import { ExportStatementBuilder } from '../../export-statement-builder';

describe('ExportStatementBuilder', () => {
  let configuration: SubstituteOf<IConfiguration>;
  let utility: SubstituteOf<IUtility>;
  let target: ExportStatementBuilder;

  beforeEach(() => {
    utility = Substitute.for<IUtility>();
    configuration = Substitute.for<IConfiguration>();
    target = new ExportStatementBuilder(utility, configuration);
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
      isBarrelImport: false
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
      isBarrelImport: true
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
      isBarrelImport: false
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
      isBarrelImport: true
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/sub/index.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement when import alias export pattern enabled', async () => {
    const config = Object.assign({}, defaultSettings);
    config.useImportAliasExportPattern = true;
    configuration.current.returns(config);

    const alias = 'Test1';
    utility.buildAlias(Arg.any()).returns(alias);

    const expected: StatementDetails = {
      statement: `import * as ${alias} from \'./test1\';`,
      alias,
      isBarrelImport: false
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/test1.ts');

    assert.deepEqual(actual, expected);
  });

  it('should build correct statement for nested barrel file when import alias export pattern enabled', async () => {
    const config = Object.assign({}, defaultSettings);
    config.useImportAliasExportPattern = true;
    configuration.current.returns(config);

    const alias = 'Sub';
    utility.buildAlias(Arg.any()).returns(alias);

    const expected: StatementDetails = {
      statement: `import * as ${alias} from \'./sub\';`,
      alias,
      isBarrelImport: true
    };

    const actual = await target.build('/c:/src/barrel', '/c:/src/barrel/sub/index.ts');

    assert.deepEqual(actual, expected);
  });

  function assumeDefaultConfiguration() {
    configuration.current.returns(defaultSettings);
  }
});
