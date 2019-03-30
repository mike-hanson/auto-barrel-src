export interface IUtility {
    buildAlias(fileName: string): string;
    getLanguageExtension(filePaths: Array<string>): string;
    pathContainsIgnoredFragment(filePath: string): boolean;
    shouldBeIncludedInBarrel(filePath: string, languageExtension: string): boolean;
}