import * as path from 'path';

import { IUtility } from './abstractions/utlity.interface';
import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { supportedExtensions } from './supported-extensions';

export class Utility implements IUtility {

    constructor(private vsCodeApi: IVsCodeApi) {}

    public buildAlias(filePath: string): string {
        const baseName = path.basename(filePath, path.extname(filePath));
        const aliasParts: string[] = [];
        let nameParts: string[];
        if(baseName.toLowerCase() === 'index') {
            const pathParts = filePath.split('/');
            const aliasBase = pathParts[pathParts.length - 2];
            nameParts = [aliasBase];
        } else {
            nameParts  = baseName.split('.');
        }

        for (const part of nameParts) {
            const partElements = part.split('-');
            for (const element of partElements) {
                aliasParts.push(element.charAt(0).toUpperCase() + element.slice(1));
            }
        }

        return aliasParts.join('');
    }

    public async containsDefaultExport(filePath: string): Promise<boolean> {
        const content = await this.vsCodeApi.getDocumentText(filePath);
        return content.indexOf('export default') !== -1;
    }

    public async findClosestBarrel(filePath: string): Promise<string> {
        const config = this.vsCodeApi.getConfiguration();
        let fileExtension = path.extname(filePath);
        if(fileExtension.toLowerCase() === '.vue') {
            // need to switch extension, possibly twice to search for barrel file
            let searchPath = filePath.replace('.vue', '.js');
            let barrelFilePath = await this.findClosestBarrel(searchPath);
            if(typeof barrelFilePath === 'undefined') {
                searchPath = filePath.replace('.vue', '.ts');
                return await this.findClosestBarrel(searchPath);
            } else {
                return barrelFilePath;
            }
        } else {
            fileExtension = fileExtension.substr(0, 3);

            const barrelFileName = `index${fileExtension}`;

            if (config.disableRecursiveBarrelling) {
                const folderPath = path.dirname(filePath);
                const barrelFilePath = `${folderPath}/${barrelFileName}`;
                const barrelFiles = await this.vsCodeApi.findFiles(barrelFilePath);
                if(barrelFiles.length > 0) {
                    return barrelFiles[0];
                }
            } else {
                const watchGlob = config.watchGlob;
                const lastSlashIndex = watchGlob.lastIndexOf('/');
                const searchGlobBase = lastSlashIndex === -1 ? watchGlob : watchGlob.substr(0, lastSlashIndex + 1);
                const searchGlob = `${searchGlobBase}${barrelFileName}`;
                const barrelFiles = await this.vsCodeApi.findFiles(searchGlob);
                if (barrelFiles.length > 0) {
                let folder = this.getParentFolder(filePath);
                if(path.basename(filePath, fileExtension)  === 'index') {
                    folder = this.getParentFolder(folder);
                }
                let barrelPath = `${folder}/${barrelFileName}`;
                let match = barrelFiles.find((f) => f === barrelPath);
                    while(!match){
                        folder = this.getParentFolder(folder);
                        barrelPath = `${folder}/${barrelFileName}`;
                        match = barrelFiles.find((f) => f === barrelPath);
                    }
                    return match;
                }
            }
            
            return undefined;
        }
    }

    public getLanguageExtension(filePaths: Array<string>): 'ts' | 'js' {
        const currentConfig = this.vsCodeApi.getConfiguration();
        if (currentConfig.alwaysUseDefaultLanguage === false) {
            const filePathsExcludingVue = filePaths.filter(p => path.extname(p) !== '.vue');
            if (filePathsExcludingVue.every(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
                return 'ts';
            } else if (filePathsExcludingVue.every(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
                return 'js';
            }
        }

        return currentConfig.defaultExtension;
    }

    public getLanguageExtensionFromFile(filePath: string): string {
        return path.extname(filePath).substr(1, 2);
    }

    public pathContainsIgnoredFragment(filePath: string): boolean {
        const ignoredFragmentsSetting = this.vsCodeApi.getConfiguration().ignoreFilePathContainingAnyOf;
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

    private getParentFolder(path: string) {
        if(path.endsWith('/')) {
            path = path.substr(0, path.length - 1);
        }
        
        const lastSlashIndex = path.lastIndexOf('/');
        if(lastSlashIndex !== -1) {
            return path.substr(0, lastSlashIndex);
        }

        return path;
    }
}