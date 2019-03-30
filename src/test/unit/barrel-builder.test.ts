import { assert } from 'chai';
import { Substitute, Arg } from '@fluffy-spoon/substitute';

import { IConfiguration } from '../../abstractions/configuration.interface';
import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { Utility } from '../../utility';
import { BarrelBuilder } from '../../barrel-builder';
import { defaultSettings } from '../../default-settings';
import { BarrelDetails } from '../../models/barrel-details';

describe('BarrelBuilder', () => {
    let target: BarrelBuilder;
    let configuration: any;
    let vsCodeApi: any;
    let utility: Utility;

    beforeEach(() => {
        configuration = Substitute.for<IConfiguration>();
        vsCodeApi = Substitute.for<IVsCodeApi>();
        utility = new Utility(configuration, vsCodeApi);
        target = new BarrelBuilder(configuration, utility);
    });

    it('should be defined', () => {
        assert.isDefined(target);
    });

    it('should implement a method to build a barrel', () => {
        assert.isFunction(target.build);
        assert.equal(target.build.length, 2);
    });

    it('should build correct content when all files are in target folder and valid TypeScript files', async () => {

        assumeDefaultConfiguration();
        assumeNoExportDefault();

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.ts',
            '/c:/barrel/test2.ts',
            '/c:/barrel/test3.ts'
        ];

        const contentLines: Array<string> = [
            'export * from \'./test1\';',
            'export * from \'./test2\';',
            'export * from \'./test3\';'
        ];

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.ts`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);
        assert.deepEqual(actual, expected); 
    });

    it('should build correct content when all files are in target folder and valid JavaScript files', async () => {

        assumeDefaultConfiguration();
        assumeNoExportDefault();

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.js',
            '/c:/barrel/test2.js',
            '/c:/barrel/test3.js'
        ];

        const contentLines: Array<string> = [
            'export * from \'./test1\';',
            'export * from \'./test2\';',
            'export * from \'./test3\';'
        ];        

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.js`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);

        assert.deepEqual(actual, expected); 
    });

    it('should build correct content when all files are in target folder and valid files with mixed extensions', async () => {

        assumeDefaultConfiguration();
        assumeNoExportDefault();

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.ts',
            '/c:/barrel/test2.js',
            '/c:/barrel/test3.tsx',
            '/c:/barrel/test4.jsx'            
        ];

        const contentLines: Array<string> = [
            'export * from \'./test1\';',
            'export * from \'./test3\';'
        ];
        

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.ts`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);

        assert.deepEqual(actual, expected); 
    });

    

    it('should build correct content when some files are in sub folders', async () => {

        assumeDefaultConfiguration();
        assumeNoExportDefault();

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.ts',
            '/c:/barrel/sub/test2.ts',
            '/c:/barrel/sub/sub/test3.ts'            
        ];

        const contentLines: Array<string> = [
            'export * from \'./test1\';',
            'export * from \'./sub/test2\';',
            'export * from \'./sub/sub/test3\';'
        ];

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.ts`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);

        assert.deepEqual(actual, expected); 
    });

    it('should build correct content when using import alias pattern', async () => {

        assumeConfigReturnsValue('useImportAliasExportPattern', true);
        assumeNoExportDefault();

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.ts',
            '/c:/barrel/test2.ts',            
        ];

        const contentLines: Array<string> = [
            'import * as Test1 from \'./test1\';',
            'import * as Test2 from \'./test2\';',
            'export { Test1, Test2 };'
        ];

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.ts`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);

        assert.deepEqual(actual, expected); 
    });

    it('should build correct content when file contains export default', async () => {

        assumeDefaultConfiguration();
        vsCodeApi.openTextDocument('/c:/barrel/test1.ts').returns(Promise.resolve('testing testing testing...'));
        vsCodeApi.openTextDocument('/c:/barrel/test2.ts').returns(Promise.resolve('testing\nexport default Test2'));

        const rootFolder = '/c:/barrel';

        const files: Array<string> = [
            '/c:/barrel/test1.ts',
            '/c:/barrel/test2.ts',            
        ];

        const contentLines: Array<string> = [
            'export * from \'./test1\';',
            'export { default as test2 } from \'./test2\';'
        ];

        const expected: BarrelDetails = {
            barrelFilePath: `${rootFolder}/index.ts`,
            contentLines
        };

        const actual = await target.build(rootFolder, files);

        assert.deepEqual(actual, expected); 
    });

    function assumeDefaultConfiguration() {
        configuration.current.returns(defaultSettings);
    }

    function assumeConfigReturnsValue<T extends string | boolean>(section: string, value: T){
        const baseSettings = Object.assign({}, defaultSettings);
        baseSettings[section] = value;
        
        configuration.current.returns(baseSettings);
    }

    function assumeNoExportDefault() {        
        vsCodeApi.openTextDocument(Arg.any()).returns(Promise.resolve('testing testing testing...'));
    }
});