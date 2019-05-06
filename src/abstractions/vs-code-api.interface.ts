import { AutoBarrelSettings } from '../models/auto-barrel-settings';
import { IDisposable } from './disposable.interface';
import { StatementDetails } from '../models/statement-details';

export interface IVsCodeApi {
    appendStatementToBarrel(barrelFilePath: string, statementDetails: StatementDetails): Promise<void>;
    createFileSystemWatcher(globPattern: string, onCreated: (path: string) => void, onDeleted: (path: string) => void): IDisposable;
    findFiles(searchGlob: string): Promise<Array<string>>;
    findSupportedFiles(folderPath: string): Promise<Array<string>>;
    getConfiguration(): AutoBarrelSettings;
    getDocumentText(filePath: string): Promise<string>;
    removeStatementFromBarrel(barrelFilePath: string, statementDetails: StatementDetails): Promise<void>;
    showInformationMessage(message: string): Promise<string>;
    showErrorMessage(message: string): Promise<string>;
    showWarningMessage(message: string): Promise<string>;
    writeFile(filePath: string, contentLines: Array<string>): Promise<void>;
}