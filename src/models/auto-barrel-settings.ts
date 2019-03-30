export interface AutoBarrelSettings {
    [index: string]: string | boolean;
    defaultExtension: string;
    alwaysUseDefaultLanguage: boolean;
    watchGlob: string;
    ignoreFilePathContainingAnyOf: string;
    useImportAliasExportPattern: boolean;
    disableRecursiveBarrelling: boolean;
}