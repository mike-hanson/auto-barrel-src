import { assert } from 'chai';

import { CreateBarrelCommand } from '../../create-barrel-command';
import { Substitute, Arg } from '@fluffy-spoon/substitute';
import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { IBarrelBuilder } from '../../abstractions/barrel-builder.interface';
import { ObjectSubstitute, OmitProxyMethods } from '@fluffy-spoon/substitute/dist/src/Transformations';

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

    let vsCodeApi: ObjectSubstitute<OmitProxyMethods<IVsCodeApi>, IVsCodeApi> & IVsCodeApi;
    let barrelBuilder: any;
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

        await target.execute(rootFolder);

        vsCodeApi.received(1).findFiles(rootFolder);
    });

    it('should delegate to barrel builder to get content for barrel', async () => {
        assumeVsCodeApiFindsFiles();
        assumeBarrelBuildReturnsResult();

        await target.execute(rootFolder);

        barrelBuilder.received(1).build(rootFolder, files);
    });

    it('should delegate to vs code api to write barrel file', async () => {
        assumeVsCodeApiFindsFiles();
        assumeBarrelBuildReturnsResult();

        await target.execute(rootFolder);

        vsCodeApi.received(1).writeFile(barrelDetails.barrelFilePath, barrelDetails.contentLines);
    });

    function assumeVsCodeApiFindsFiles() {
        vsCodeApi.findFiles(rootFolder).returns(Promise.resolve(files));
    }

    function assumeBarrelBuildReturnsResult() {
        barrelBuilder.build(Arg.all()).returns(Promise.resolve(barrelDetails));
    }
});