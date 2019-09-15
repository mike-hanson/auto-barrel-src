import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from '@testpossessed/ts-substitute';

import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { IBarrelBuilder } from '../../abstractions/barrel-builder.interface';
import { UpdateBarrelCommand } from '../../update-barrel-command';

describe('UpdateBarrelCommand', () => {
  const rootFolder = '/c:/barrel';
  const barrelFilePath = rootFolder + '/index.ts';
  const files: Array<string> = ['/c:/barrel/test1.ts', '/c:/barrel/test2.ts', '/c:/barrel/test3.ts'];
  // tslint:disable: quotemark
  const contentLines: Array<string> = [
    "export * from './test1';",
    "export * from './test2';",
    "export * from './test3';"
  ];
  // tslint:enable: quotemark
  const barrelDetails = { barrelFilePath: `${rootFolder}/index.ts`, contentLines };

  let vsCodeApi: SubstituteOf<IVsCodeApi>;
  let barrelBuilder: SubstituteOf<IBarrelBuilder>;
  let target: UpdateBarrelCommand;

  beforeEach(() => {
    vsCodeApi = Substitute.for<IVsCodeApi>();
    barrelBuilder = Substitute.for<IBarrelBuilder>();
    target = new UpdateBarrelCommand(vsCodeApi, barrelBuilder);
  });

  it('should be defined', () => {
    assert.isDefined(target);
  });

  it('should define a method to execute the command', () => {
    assert.isFunction(target.execute);
    assert.equal(target.execute.length, 1);
  });

  it('should fetch files via vs code api', async () => {
    assumeVsCodeApiFindsFiles();
    assumeBarrelBuildReturnsResult();
    assumeOverWriteFileReturnsResult();

    await target.execute(barrelFilePath);

    vsCodeApi.received().findSupportedFiles(rootFolder);
  });

  it('should delegate to barrel builder to get content for barrel', async () => {
    assumeVsCodeApiFindsFiles();
    assumeBarrelBuildReturnsResult();
    assumeOverWriteFileReturnsResult();

    await target.execute(barrelFilePath);

    barrelBuilder.received(1).build(rootFolder, files);
  });

  it('should delegate to vs code api to write barrel file', async () => {
    assumeVsCodeApiFindsFiles();
    assumeBarrelBuildReturnsResult();
    assumeOverWriteFileReturnsResult();

    await target.execute(barrelFilePath);

    vsCodeApi.received().overwriteFileContent(barrelDetails.barrelFilePath, barrelDetails.contentLines);
  });

  function assumeVsCodeApiFindsFiles() {
    vsCodeApi.findSupportedFiles(Arg.any()).returnsAsync(files);
  }

  function assumeBarrelBuildReturnsResult() {
    barrelBuilder.build(Arg.any(), Arg.any()).returnsAsync(barrelDetails);
  }

  function assumeOverWriteFileReturnsResult() {
    vsCodeApi.overwriteFileContent(Arg.any(), Arg.any()).returnsAsync(undefined);
  }
});
