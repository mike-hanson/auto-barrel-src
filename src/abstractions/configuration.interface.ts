import { AutoBarrelSettings } from '../models/auto-barrel-settings';

export interface IConfiguration {
    readonly current: AutoBarrelSettings;
    readonly defaultExtension: string;
    readonly alwaysUseDefaultLanguage: boolean;
    readonly watchGlob: string;
    readonly ignoreFilePathContainingAnyOf: string;
    readonly useImportAliasExportPattern: boolean;
    readonly disableRecursiveBarrelling: boolean;
}
