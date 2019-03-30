import { AutoBarrelSettings } from '../models/auto-barrel-settings';

export interface IVsCodeApi {
    findFiles(folderPath: string): Promise<Array<string>>;
    getConfiguration(): AutoBarrelSettings;
    openTextDocument(filePath: string): Promise<string>;
    writeFile(filePath: string, contentLines: Array<string>): Promise<void>;
}