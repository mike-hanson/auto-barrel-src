export interface IConfiguration {
    readonly defaultExtension: string;
    readonly alwaysUseDefaultLanguage: boolean;
    readonly watchGlob: string;
    readonly ignoreFilePathContainingAnyOf: string;
    readonly useImportAliasExportPattern: boolean;
    readonly disableRecursiveBarrelling: boolean;
}
