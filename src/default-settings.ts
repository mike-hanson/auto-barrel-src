import { AutoBarrelSettings } from './models/auto-barrel-settings';

export const defaultSettings: AutoBarrelSettings = {
    defaultExtension: 'ts',
    alwaysUseDefaultLanguage: false,
    watchGlob: 'src/**/*.{js,jsx,ts,tsx}',
    ignoreFilePathContainingAnyOf: '.spec,.test',
    useImportAliasExportPattern: false,
    disableRecursiveBarrelling: false
};