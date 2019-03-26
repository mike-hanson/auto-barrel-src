import * as vscode from 'vscode';

import { Configuration } from "../../configuration";
import { defaultSettings } from "../../default-settings";

describe('Configuration', () => {
    let target: Configuration;
    let configurationMock: vscode.WorkspaceConfiguration;

    beforeEach(() => {
        configurationMock = {
            get: (): any => { },
            has: (): any => { },
            inspect: (): any => { },
            update: (): any => { }
        };
        spyOn(vscode.workspace, 'getConfiguration').and.returnValue(configurationMock);
        target = new Configuration();
    });

    it('should be defined', () => {
        expect(target).toBeDefined();
    });

    it('should return correct default for defaultExtension', () => {
        expect(target.defaultExtension).toBe(defaultSettings.defaultExtension);
    });

    it('should return correct default for alwaysUseDefaultLanguage', () => {
        expect(target.alwaysUseDefaultLanguage).toBe(defaultSettings.alwaysUseDefaultLanguage);
    });

    it('should return correct default for watchGlob', () => {
        expect(target.watchGlob).toBe(defaultSettings.watchGlob);
    });

    it('should return correct default for ingnoreFilePathContainingAnyOf', () => {
        expect(target.ignoreFilePathContainingAnyOf).toBe(defaultSettings.ignoreFilePathContainingAnyOf);
    });

    it('should return correct default for useImportAliasExportPattern', () => {
        expect(target.useImportAliasExportPattern).toBe(defaultSettings.useImportAliasExportPattern);
    });

    it('should return correct default for disableRecursiveBarrelling', () => {
        expect(target.disableRecursiveBarrelling).toBe(defaultSettings.disableRecursiveBarrelling);
    });

    it('should return value from VS Code configuration for defaultExtension', () => {
        spyOn(configurationMock, 'get').and.returnValue('JavaScript');
        expect(target.defaultExtension).toBe('js');
    });

});