import { AutoBarrelSettings } from './models/auto-barrel-settings';

export const defaultSettings: AutoBarrelSettings = {
    defaultExtension: 'ts',
    alwaysUseDefaultLanguage: false,
    watchGlob: 'src/**/*.{js,jsx,ts,tsx,vue}',
    ignoreFilePathContainingAnyOf: '.spec,.test',
    useImportAliasExportPattern: false,
    disableRecursiveBarrelling: false,
    excludeSemiColonAtEndOfLine: false,
    includeExtensionOnExport: '.vue',
    quoteStyle: 'Single'
};