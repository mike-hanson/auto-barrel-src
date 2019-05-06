import { assert } from 'chai';
import { Substitute, Arg, SubstituteOf } from 'ts-substitute';

import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { IBarrelBuilder } from '../../abstractions/barrel-builder.interface';
import { CreateBarrelCommand } from '../../create-barrel-command';

describe('CreateBarrelCommand', () => {
    const rootFolder = '\/c:\/barrel';
    const files: Array<string> = [
        '\/c:\/barrel\/test1.ts',
        '\/c:\/barrel\/test2.ts',
        '\/c:\/barrel\/test3.ts'
    ];
    const contentLines: Array<string> = [
        'export * from \'./test1\';',
        'export * from \'./test2\';',
        'export * from \'./test3\';'
    ];
    const barrelDetails = { barrelFilePath: `${rootFolder}/index.ts`, contentLines };

    let vsCodeApi: SubstituteOf<IVsCodeApi>;
    let barrelBuilder: SubstituteOf<IBarrelBuilder>;
    let target: CreateBarrelCommand;

    beforeEach(() => {
        vsCodeApi = Substitute.for<IVsCodeApi>();
        barrelBuilder = Substitute.for<IBarrelBuilder>();
        target = new CreateBarrelCommand(vsCodeApi, barrelBuilder);
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
        assumeWriteFileReturnsResult();

        await target.execute(rootFolder);

        vsCodeApi.received().findSupportedFiles(rootFolder);
    });

    it('should delegate to barrel builder to get content for barrel', async () => {
        assumeVsCodeApiFindsFiles();
        assumeBarrelBuildReturnsResult();
        assumeWriteFileReturnsResult();

        await target.execute(rootFolder);

        barrelBuilder.received(1).build(rootFolder, files);
    });

    it.skip('should delegate to vs code api to write barrel file', async () => {
        assumeVsCodeApiFindsFiles();
        assumeBarrelBuildReturnsResult();
        assumeWriteFileReturnsResult();

        await target.execute(rootFolder);

        vsCodeApi.received().writeFile(barrelDetails.barrelFilePath, barrelDetails.contentLines);
    });

    function assumeVsCodeApiFindsFiles() {
        vsCodeApi.findSupportedFiles(Arg.any()).returnsAsync(files);
    }

    function assumeBarrelBuildReturnsResult() {
        barrelBuilder.build(Arg.any(), Arg.any()).returnsAsync(barrelDetails);
    }

    function assumeWriteFileReturnsResult() {
        vsCodeApi.writeFile(Arg.any(), Arg.any()).returnsAsync(undefined);
    }
});