import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from '@testpossessed/ts-substitute';

import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { defaultSettings } from '../../default-settings';
import { IDisposable } from '../../abstractions/disposable.interface';
import { IUtility } from '../../abstractions/utlity.interface';
import { IExportStatementBuilder } from '../../abstractions/export-statement-builder.interface';
import { StatementDetails } from '../../models/statement-details';
import { AutoBarreller } from '../../auto-barreller';

describe('AutoBarreller', () => {
  const defaultBarrelFolder = '/c:/src/barrel';
  const defaultBarrelFilePath = `${defaultBarrelFolder}/index.ts`;
  let vsCodeApi: SubstituteOf<IVsCodeApi>;
  let utility: SubstituteOf<IUtility>;
  let exportStatementBuilder: SubstituteOf<IExportStatementBuilder>;
  let target: AutoBarreller;

  const statementDetails: StatementDetails = {
    alias: undefined,
    statement: 'export this',
    isBarrelImport: false
  };

  beforeEach(() => {
    vsCodeApi = Substitute.for<IVsCodeApi>();
    utility = Substitute.for<IUtility>();
    exportStatementBuilder = Substitute.for<IExportStatementBuilder>();
    assumeVsCodeApiReturnsPromises();
    target = new AutoBarreller(vsCodeApi, utility, exportStatementBuilder);
  });

  it('should define a method to start watching for changes', () => {
    assert.isFunction(target.start);
    assert.equal(target.start.length, 0);
  });

  it('should define a method to stop watching for changes', () => {
    assert.isFunction(target.stop);
    assert.equal(target.stop.length, 0);
  });

  describe('start', () => {
    it('should create file system watcher', async () => {
      assumeDefaultConfiguration();

      await target.start();

      vsCodeApi.received(1).createFileSystemWatcher(defaultSettings.watchGlob, Arg.any(), Arg.any());
    });

    it('should show message and exit early if already started', async () => {
      assumeDefaultConfiguration();
      await target.start();

      await target.start();

      vsCodeApi.received().showWarningMessage('Auto Barrel is already running.');
      vsCodeApi.didNotReceive().createFileSystemWatcher(Arg.any('String'), Arg.any(), Arg.any());
    });

    // it('should show message on error', () => {
    //     assumeDefaultConfiguration();
    //     vsCodeApi.createFileSystemWatcher(Arg.any(), Arg.any(), Arg.any()).mimicks(() => { throw (new Error()); });

    //     target.start();

    //     vsCodeApi.received().showErrorMessage('Auto Barrel start failed, please check the console for more information.');
    // });
  });

  describe('stop', () => {
    it('should dispose of file system watcher', async () => {
      assumeDefaultConfiguration();
      const fileSystemWatcher = Substitute.for<IDisposable>();
      vsCodeApi.createFileSystemWatcher(Arg.any(), Arg.any(), Arg.any()).returns(fileSystemWatcher);
      await target.start();

      await target.stop();

      fileSystemWatcher.received().dispose();
    });

    it('should show message and exit early if not started', async () => {
      await target.stop();

      vsCodeApi.received().showWarningMessage('Auto Barrel is not running, no action taken.');
    });
  });

  describe('dispose', () => {
    it('should dispose of file system watcher', async () => {
      assumeDefaultConfiguration();
      const fileSystemWatcher = Substitute.for<IDisposable>();
      vsCodeApi
        .createFileSystemWatcher(Arg.any('String'), Arg.any('Function'), Arg.any('Function'))
        .returns(fileSystemWatcher);

      await target.start();

      target.dispose();

      fileSystemWatcher.received().dispose();
    });
  });

  describe('handleFileCreated', () => {
    it('should do nothing if file excluded via config', async () => {
      assumeDefaultConfiguration();

      const createdFilePath = '/c:/src/barrel/sub/test1.test.ts';
      utility.pathContainsIgnoredFragment(Arg.any()).returns(true);

      await target.handleFileCreated(createdFilePath);

      utility.didNotReceive().findClosestBarrel(createdFilePath);
    });

    it('should find closest barrel file', async () => {
      assumeDefaultConfiguration();
      assumeFileIsNotExcluded();
      assumeBarrelFileIsFound();
      assumeBarrelFileShouldBeIncluded();
      assumeStatementBuilderReturnsResult();

      const createdFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileCreated(createdFilePath);

      utility.received().findClosestBarrel(createdFilePath);
    });

    it('should build statement', async () => {
      assumeDefaultConfiguration();
      assumeFileIsNotExcluded();
      assumeBarrelFileIsFound();
      assumeBarrelFileShouldBeIncluded();
      assumeStatementBuilderReturnsResult();

      const createdFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileCreated(createdFilePath);

      exportStatementBuilder.received().build(defaultBarrelFolder, createdFilePath);
    });

    it('should stop if no barrel file found', async () => {
      assumeDefaultConfiguration();
      assumeFileIsNotExcluded();
      utility.findClosestBarrel(Arg.any()).returnsAsync(undefined);
      assumeBarrelFileShouldBeIncluded();
      assumeStatementBuilderReturnsResult();

      const createdFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileCreated(createdFilePath);

      exportStatementBuilder.didNotReceive().build(Arg.any(), Arg.any());
    });

    it('should stop if file not compatible with barrel', async () => {
      assumeDefaultConfiguration();
      assumeFileIsNotExcluded();
      assumeBarrelFileIsFound();

      utility.shouldBeIncludedInBarrel(Arg.any(), Arg.any()).returns(false);

      const createdFilePath = '/c:/src/barrel/sub/test1.js';
      await target.handleFileCreated(createdFilePath);

      exportStatementBuilder.didNotReceive().build(Arg.any(), Arg.any());
    });

    it('should delegate to vs code api to append statement to barrel', async () => {
      assumeDefaultConfiguration();
      assumeFileIsNotExcluded();
      assumeBarrelFileIsFound();
      assumeBarrelFileShouldBeIncluded();
      assumeStatementBuilderReturnsResult();

      const createdFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileCreated(createdFilePath);

      vsCodeApi.received().appendStatementToBarrel(defaultBarrelFilePath, statementDetails);
    });

    function assumeFileIsNotExcluded() {
      utility.pathContainsIgnoredFragment(Arg.any()).returns(false);
    }
    function assumeBarrelFileShouldBeIncluded() {
      utility.shouldBeIncludedInBarrel(Arg.any(), Arg.any()).returns(true);
    }
  });

  describe('handleFileDeleted', async () => {
    it('should find closest barrel file', async () => {
      assumeDefaultConfiguration();
      assumeBarrelFileIsFound();
      assumeStatementBuilderReturnsResult();

      const deletedFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileDeleted(deletedFilePath);

      utility.received().findClosestBarrel(deletedFilePath);
    });

    it('should delegate to vs code api to remove statement from barrel', async () => {
      assumeDefaultConfiguration();
      assumeBarrelFileIsFound();
      assumeStatementBuilderReturnsResult();

      const deletedFilePath = '/c:/src/barrel/sub/test1.ts';
      await target.handleFileDeleted(deletedFilePath);

      // tslint:disable-next-line: quotemark
      vsCodeApi.received().removeStatementFromBarrel(defaultBarrelFilePath, "from './sub/test1'");
    });
  });

  function assumeDefaultConfiguration() {
    vsCodeApi.getConfiguration().returns(defaultSettings);
  }

  function assumeVsCodeApiReturnsPromises() {
    vsCodeApi.showInformationMessage(Arg.any()).returnsAsync('dummy');
    vsCodeApi.showWarningMessage(Arg.any()).returnsAsync('dummy');
    vsCodeApi.showErrorMessage(Arg.any()).returnsAsync('dummy');
    vsCodeApi.appendStatementToBarrel(Arg.any(), Arg.any()).returnsAsync(undefined);
    vsCodeApi.removeStatementFromBarrel(Arg.any(), Arg.any()).returnsAsync(undefined);
  }

  function assumeBarrelFileIsFound(filePath: string = defaultBarrelFilePath) {
    utility.findClosestBarrel(Arg.any()).returnsAsync(filePath);
  }

  function assumeStatementBuilderReturnsResult() {
    exportStatementBuilder.build(Arg.any(), Arg.any()).returnsAsync(statementDetails);
  }
});
