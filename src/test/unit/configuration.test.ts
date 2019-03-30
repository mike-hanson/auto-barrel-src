import * as expect from 'expect';
import { Substitute, Arg } from '@fluffy-spoon/substitute';

import { IVsCodeApi } from '../../abstractions/vs-code-api.interface';
import { defaultSettings } from '../../default-settings';
import { Configuration } from '../../configuration';
import { AutoBarrelSettings } from '../../models/auto-barrel-settings';

describe('Configuration', () => {
    let vsCodeApiMock: any;
    let target: Configuration;

    beforeEach(() => {
        vsCodeApiMock  = Substitute.for<IVsCodeApi>();
        target = new Configuration(vsCodeApiMock);
    });

    it('should be defined', () => {
        expect(target).toBeDefined();
    });

    it('should return default settings for current', () => {
        assumeConfigReturnsDefaultSettings();

        expect(target.current).toBe(defaultSettings);
    });

    it('should return correct default for defaultExtension', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.defaultExtension).toBe(defaultSettings.defaultExtension);
    });

    it('should return correct default for alwaysUseDefaultLanguage', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.alwaysUseDefaultLanguage).toBe(defaultSettings.alwaysUseDefaultLanguage);
    });

    it('should return correct default for watchGlob', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.watchGlob).toBe(defaultSettings.watchGlob);
    });

    it('should return correct default for ingnoreFilePathContainingAnyOf', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.ignoreFilePathContainingAnyOf).toBe(defaultSettings.ignoreFilePathContainingAnyOf);
    });

    it('should return correct default for useImportAliasExportPattern', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.useImportAliasExportPattern).toBe(defaultSettings.useImportAliasExportPattern);
    });

    it('should return correct default for disableRecursiveBarrelling', () => {
        assumeConfigReturnsDefaultSettings();
        
        expect(target.disableRecursiveBarrelling).toBe(defaultSettings.disableRecursiveBarrelling);
    });

    it('should return value from VS Code configuration for defaultExtension', () => {
        assumeConfigReturnsValue<string>('defaultExtension', 'js');

        expect(target.defaultExtension).toBe('js');
    });

    it('should return value from VS Code configuration for alwaysUseDefaultLanguage', () => {
        assumeConfigReturnsValue<boolean>('alwaysUseDefaultLanguage', true);

        expect(target.alwaysUseDefaultLanguage).toBe(true);
    });

    it('should return value from VS Code configuration for watchGlob', () => {
        const expected = 'somethingElse';
        assumeConfigReturnsValue<string>('watchGlob', expected);

        expect(target.watchGlob).toBe(expected);
    });

    it('should return value from VS Code configuration for ignoreFilePathContainingAnyOf', () => {
        const expected = 'somethingElse';
        assumeConfigReturnsValue<string>('ignoreFilePathContainingAnyOf', expected);

        expect(target.ignoreFilePathContainingAnyOf).toBe(expected);
    });

    it('should return value from VS Code configuration for useImportAliasExportPattern', () => {
        assumeConfigReturnsValue<boolean>('useImportAliasExportPattern', true);

        expect(target.useImportAliasExportPattern).toBe(true);
    });

    it('should return value from VS Code configuration for disableRecursiveBarrelling', () => {
        assumeConfigReturnsValue<boolean>('disableRecursiveBarrelling', true);

        expect(target.disableRecursiveBarrelling).toBe(true);
    });

    it('should return updated settings from configuration for current', () => {
        const expected: AutoBarrelSettings = {
            defaultExtension: 'js',
            alwaysUseDefaultLanguage: true,
            watchGlob: 'watchGlob',
            ignoreFilePathContainingAnyOf: 'ignore',
            useImportAliasExportPattern: true,
            disableRecursiveBarrelling: true
        };
        vsCodeApiMock.getConfiguration().returns(expected);

        expect(target.current).toEqual(expected);
    });

    function assumeConfigReturnsDefaultSettings(){
        vsCodeApiMock.getConfiguration().returns(defaultSettings);
    }

    function assumeConfigReturnsValue<T extends string | boolean>(section: string, value: T){
        const baseSettings = Object.assign({}, defaultSettings);
        baseSettings[section] = value;
        
        vsCodeApiMock.getConfiguration(Arg.all()).returns(baseSettings);
    }

});