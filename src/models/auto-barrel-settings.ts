export interface AutoBarrelSettings {
    [index: string]: string | boolean;
    defaultExtension: 'ts' | 'js';
    alwaysUseDefaultLanguage: boolean;
    watchGlob: string;
    ignoreFilePathContainingAnyOf: string;
    useImportAliasExportPattern: boolean;
    disableRecursiveBarrelling: boolean;
    excludeSemiColonAtEndOfLine: boolean;
    includeExtensionOnExport: string;
    quoteStyle: 'Single' | 'Double';
}