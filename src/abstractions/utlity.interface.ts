export interface IUtility {
    buildAlias(fileName: string): string;
    containsDefaultExport(filePath: string): Promise<boolean>;
    findClosestBarrel(filePath: string): Promise<string | undefined>;
    getLanguageExtension(filePaths: Array<string>): 'ts' | 'js';
    getLanguageExtensionFromFile(filePath: string): string;
    pathContainsIgnoredFragment(filePath: string): boolean;
    shouldBeIncludedInBarrel(filePath: string, languageExtension: string): boolean;
}