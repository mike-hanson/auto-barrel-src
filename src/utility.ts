import * as path from 'path';

import { IUtility } from './abstractions/utlity.interface';
import { Configuration } from './configuration';
import { supportedExtensions } from './supported-extensions';
import { VsCodeApi } from './vs-code-api';

export class Utility implements IUtility {

    constructor(private configuration: Configuration,
        private vsCodeApi: VsCodeApi) {
    }

    public buildAlias(filePath: string): string {
        const actualFileName = path.basename(filePath, path.extname(filePath));
        const aliasParts: string[] = [];

        const fileNameParts = actualFileName.split('.');
        for (const part of fileNameParts) {
            const partElements = part.split('-');
            for (const element of partElements) {
                aliasParts.push(element.charAt(0).toUpperCase() + element.slice(1));
            }
        }

        return aliasParts.join('');
    }

    public async containsDefaultExport(filePath: string): Promise<boolean> {
        const content = await this.vsCodeApi.openTextDocument(filePath);        
        return content.indexOf('export default') !== -1;
    }

    public getLanguageExtension(filePaths: Array<string>): string {
        const currentConfig = this.configuration.current;
        if (currentConfig.alwaysUseDefaultLanguage === false) {

            if (filePaths.every(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
                return 'ts';
            } else if (filePaths.every(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
                return 'js';
            }
        }

        return currentConfig.defaultExtension;
    }

    public pathContainsIgnoredFragment(filePath: string): boolean {
        const ignoredFragmentsSetting = this.configuration.current.ignoreFilePathContainingAnyOf;
        if (ignoredFragmentsSetting) {
            const fragments = ignoredFragmentsSetting.split(',');
            if (fragments && fragments.length) {
                return fragments.some(f => filePath.indexOf(f) !== -1);
            }
        }
        return false;
    }

    public shouldBeIncludedInBarrel(filePath: string, languageExtension: string): boolean {
        const possibleExtensions = supportedExtensions[languageExtension];
        const fileExtension = path.extname(filePath);

        return possibleExtensions.indexOf(fileExtension) !== -1 && !this.pathContainsIgnoredFragment(filePath);
    }
}