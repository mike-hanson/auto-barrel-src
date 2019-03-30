import * as expect from 'expect';
import Substitute from '@fluffy-spoon/substitute';

import { IConfiguration } from '../../abstractions/configuration.interface';
import { Utility } from '../../utility';
import { defaultSettings } from '../../default-settings';
import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';

describe('Utility', () => {
    let target: Utility;
    let configuration: any;
    let vsCodeApi: any;

    beforeEach(() => {
        vsCodeApi = Substitute.for<IVsCodeApi>();
        configuration = Substitute.for<IConfiguration>();
        target = new Utility(configuration, vsCodeApi);
    });

    it('should be defined', () => {
        expect(target).toBeDefined();
    });

    it('should implement a method to get build an alias for a file', () => {
        expect(typeof target.buildAlias).toBe('function');
        expect(target.buildAlias.length).toBe(1);
    });

    it('should implement a method to determine whether a file contains a default export', () => {
        expect(typeof target.containsDefaultExport).toBe('function');
        expect(target.containsDefaultExport.length).toBe(1);
    });

    it('should implement a method to get language extension', () => {
        expect(typeof target.getLanguageExtension).toBe('function');
        expect(target.getLanguageExtension.length).toBe(1);
    });

    it('should implement a method to determine whether a file is exclude by config', () => {
        expect(typeof target.pathContainsIgnoredFragment).toBe('function');
        expect(target.pathContainsIgnoredFragment.length).toBe(1);
    });

    it('should implement a method to determine whether a file should be included in a barrel', () => {
        expect(typeof target.shouldBeIncludedInBarrel).toBe('function');
        expect(target.shouldBeIncludedInBarrel.length).toBe(2);
    });

    describe('buildAlias', () => {
        it('should return correct alias for simple file name', () => {
            expect(target.buildAlias('name.ext')).toBe('Name');
        });

        it('should return correct alias for file name with hyphens to separate words', () => {
            expect(target.buildAlias('my-name.ext')).toBe('MyName');
        });

        it('should return correct alias for file name with multiple dot seprated parts', () => {
            expect(target.buildAlias('my.name.ext')).toBe('MyName');
        });
    });

    describe('containsDefaultExport', () => {
        it('should return correct result for file with default export', async () => {
            vsCodeApi.openTextDocument('test1.ts').returns(Promise.resolve('testing \nexport default Test1'));

            const actual = await target.containsDefaultExport('test1.ts');
            expect(actual).toBe(true);
        });
        
        it('should return correct result for file without default export', async () => {
            vsCodeApi.openTextDocument('test1.ts').returns(Promise.resolve('testing testing testing...'));

            const actual = await target.containsDefaultExport('test1.ts');
            expect(actual).toBe(false);
        });
    });

    describe('getLanguageExtension', () => {
        it('should return correct extension when all files have .ts extension', () => {
            assumeDefaultConfiguration();

            const filePaths: Array<string> = [
                'C:\\barrel\\test1.ts',
                'C:\\barrel\\test2.ts',
                'C:\\barrel\\test3.ts'
            ];

            expect(target.getLanguageExtension(filePaths)).toBe('ts');
        });

        it('should return correct extension when all files have .js extension', () => {
            assumeDefaultConfiguration();

            const filePaths: Array<string> = [
                'C:\\barrel\\test1.js',
                'C:\\barrel\\test2.js',
                'C:\\barrel\\test3.js'
            ];

            expect(target.getLanguageExtension(filePaths)).toBe('js');
        });

        it('should return default extension if configured to always use default', () => {
            const config = Object.assign({}, defaultSettings);
            config.alwaysUseDefaultLanguage = true;
            configuration.current.returns(config);

            const filePaths: Array<string> = [
                'C:\\barrel\\test1.ts',
                'C:\\barrel\\test2.ts',
                'C:\\barrel\\test3.ts'
            ];

            expect(target.getLanguageExtension(filePaths)).toBe(config.defaultExtension);
        });

        it('should return default extension if file extensions are mixed', () => {
            assumeDefaultConfiguration();

            const filePaths: Array<string> = [
                'C:\\barrel\\test1.ts',
                'C:\\barrel\\test2.js',
                'C:\\barrel\\test3.ts'
            ];
            expect(target.getLanguageExtension(filePaths)).toBe(defaultSettings.defaultExtension);
        });

    });

    describe('pathContainsIgnoredFragment', () => {
        it('should return true if file path contains any excluded fragment', () => {
            assumeDefaultConfiguration();

            expect(target.pathContainsIgnoredFragment('some.test.ts')).toBe(true);
        });

        it('should return false if file path does not contain any excluded fragment', () => {
            assumeDefaultConfiguration();

            expect(target.pathContainsIgnoredFragment('some.class.ts')).toBe(false);
        });
    });

    describe('shouldBeIncludedInBarrrel', () => {
        it('should return true for file with supported extension and no excluded fragment', () => {
            assumeDefaultConfiguration();

            expect(target.shouldBeIncludedInBarrel('some.class.ts', 'ts')).toBe(true);
            expect(target.shouldBeIncludedInBarrel('some.class.tsx', 'ts')).toBe(true);
            expect(target.shouldBeIncludedInBarrel('some.class.js', 'js')).toBe(true);
            expect(target.shouldBeIncludedInBarrel('some.class.jsx', 'js')).toBe(true);
        });

        it('should return false for file with unsupported extension', () => {
            assumeDefaultConfiguration();

            expect(target.shouldBeIncludedInBarrel('some.class.vs', 'ts')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.class.vs', 'js')).toBe(false);
        });

        it('should return false for file with supported extension but excluded fragment', () => {
            assumeDefaultConfiguration();

            expect(target.shouldBeIncludedInBarrel('some.test.ts', 'ts')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.tsx', 'ts')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.js', 'js')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.jsx', 'js')).toBe(false);
        });

        it('should return false for file with supported extension but does not match language extension', () => {
            assumeDefaultConfiguration();

            expect(target.shouldBeIncludedInBarrel('some.test.ts', 'js')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.tsx', 'js')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.js', 'ts')).toBe(false);
            expect(target.shouldBeIncludedInBarrel('some.test.jsx', 'ts')).toBe(false);
        });
    });

    function assumeDefaultConfiguration() {
        configuration.current.returns(defaultSettings);
    }
});