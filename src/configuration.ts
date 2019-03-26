
import * as vscode from 'vscode';
// import { injectable } from 'inversify';

import { IConfiguration } from './abstractions/configuration';
import { defaultSettings } from './default-settings';

// @injectable()
export class Configuration implements IConfiguration {
    private workspaceConfiguration: vscode.WorkspaceConfiguration | undefined = undefined;

    constructor() {
        if (typeof vscode !== 'undefined') {
            this.workspaceConfiguration = vscode.workspace.getConfiguration("autoBarrel");
        }
    }

    public get defaultExtension(): string {
        
        const configSetting = this.getSettingFromConfig<string>('defaultLanguage');
        if(configSetting) {
            return configSetting === 'JavaScript'? 'js': 'ts';
        }
        return defaultSettings.defaultExtension;
    }

    public get alwaysUseDefaultLanguage(): boolean {
        return defaultSettings.alwaysUseDefaultLanguage;
    }

    public get watchGlob(): string {
        return defaultSettings.watchGlob;
    }

    public get ignoreFilePathContainingAnyOf(): string {
        return defaultSettings.ignoreFilePathContainingAnyOf;
    }

    public get useImportAliasExportPattern(): boolean {
        return defaultSettings.useImportAliasExportPattern;
    }

    public get disableRecursiveBarrelling(): boolean {
        return defaultSettings.disableRecursiveBarrelling;
    }

    private getSettingFromConfig<T>(sectionName: string): T | undefined {
        if(this.workspaceConfiguration) {
            return this.workspaceConfiguration.get<T>(sectionName);
        }
        return undefined;
    }
}