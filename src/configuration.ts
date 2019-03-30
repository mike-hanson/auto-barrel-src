import { IConfiguration } from './abstractions/configuration.interface';
import { VsCodeApi } from './vs-code-api';
import { AutoBarrelSettings } from './models/auto-barrel-settings';

export class Configuration implements IConfiguration {
    constructor(private vsCodeApi: VsCodeApi) {
    }

    public get current(): AutoBarrelSettings {
        return this.vsCodeApi.getConfiguration();
    }

    public get defaultExtension(): string {
        return this.current.defaultExtension;
    }

    public get alwaysUseDefaultLanguage(): boolean {
        return this.current.alwaysUseDefaultLanguage;
    }

    public get watchGlob(): string {
        return this.current.watchGlob;
    }

    public get ignoreFilePathContainingAnyOf(): string {
        return this.current.ignoreFilePathContainingAnyOf;
    }

    public get useImportAliasExportPattern(): boolean {
        return this.current.useImportAliasExportPattern;
    }

    public get disableRecursiveBarrelling(): boolean {
        return this.current.disableRecursiveBarrelling;
    }
}