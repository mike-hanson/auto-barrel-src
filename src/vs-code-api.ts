import * as vscode from 'vscode';

import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { IDisposable } from './abstractions/disposable.interface';
import { AutoBarrelSettings } from './models/auto-barrel-settings';
import { defaultSettings } from './default-settings';
import { StatementDetails } from './models/statement-details';

export class VsCodeApi implements IVsCodeApi {

    public async appendStatementToBarrel(barrelFilePath: string, statementDetails: StatementDetails): Promise<void> {
        const document = await this.openTextDocument(barrelFilePath);
        if (document.lineCount >= 1) {
            if (document.lineAt(0).text.indexOf('auto-barrel-ignore') !== -1) {
                return;
            }
        }

        const lastLineWithContent = document.lineCount;
        for (let i = lastLineWithContent; i > 0; i--) {
            if(document.lineAt(i).text.length) {
                break;
            }
        }
        const newLinePosition = new vscode.Position(lastLineWithContent + 1, 0);
        const barrelFileUri = vscode.Uri.file(barrelFilePath);
        const workspaceEdit = new vscode.WorkspaceEdit();
        if (statementDetails.alias) {
            const aliasLine = document.lineAt(lastLineWithContent);
            const originalAliasStatement = aliasLine.text;
            const newAliasStatement = originalAliasStatement.replace(' };', `, ${statementDetails.alias} };`);
            workspaceEdit.replace(barrelFileUri, aliasLine.range, statementDetails.statement);
            workspaceEdit.insert(barrelFileUri, newLinePosition, newAliasStatement);
        } else {
            workspaceEdit.insert(barrelFileUri, newLinePosition, statementDetails.statement);
        }

        const result = await vscode.workspace.applyEdit(workspaceEdit);
        if (result) {
          await vscode.window.showInformationMessage(`The new file was added to ${barrelFilePath}`, {
            modal: false
          });

        } else {
          await vscode.window.showWarningMessage(`Unable to add the new file to ${barrelFilePath}`, {
            modal: false
          });
        }

        return;
    }

    public createFileSystemWatcher(globPattern: string, onCreated: (path: string) => void, onDelete: (path: string) => void): IDisposable {
        const result = vscode.workspace.createFileSystemWatcher(globPattern, false, true, false);

        result.onDidCreate((uri: vscode.Uri) => onCreated(uri.path));
        result.onDidDelete((uri: vscode.Uri) => onDelete(uri.path));

        return result;
    }

    public async findSupportedFiles(folderPath: string): Promise<Array<string>> {
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.{js,jsx,ts,tsx}'));
        return files.map(f => f.path);
    }

    public async findFiles(searchGlob: string): Promise<Array<string>> {
        const files = await vscode.workspace.findFiles(searchGlob);
        return files.map(f => f.path);
    }

    public getConfiguration(): AutoBarrelSettings {
        const config = vscode.workspace.getConfiguration('autoBarrel');
        if (typeof config === 'undefined') {
            return defaultSettings;
        }

        const defaultLanguage = config.get<string>('defaultLanguage');
        const defaultExtension = defaultLanguage === 'JavaScript' ? 'js' : 'ts';

        return {
            defaultExtension: defaultExtension,
            alwaysUseDefaultLanguage: getSettingOrDefault<boolean>(config, 'alwaysUseDefaultLanguage'),
            watchGlob: getSettingOrDefault<string>(config, 'watchGlob'),
            ignoreFilePathContainingAnyOf: getSettingOrDefault<string>(config, 'ignoreFilePathContainingAnyOf'),
            useImportAliasExportPattern: getSettingOrDefault<boolean>(config, 'useImportAliasExportPattern'),
            disableRecursiveBarrelling: getSettingOrDefault<boolean>(config, 'disableRecursiveBarrelling')
        };

        function getSettingOrDefault<T extends string | boolean>(config: vscode.WorkspaceConfiguration, section: string): T {
            const configSetting = config.get<T>(section);
            if (typeof configSetting !== 'undefined') {
                return configSetting as T;
            }
            return defaultSettings[section] as T;
        }
    }

    public async getDocumentText(filePath: string): Promise<string> {
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        return document.getText();
    }
    
    public async removeStatementFromBarrel(barrelFilePath: string, statementDetails: StatementDetails): Promise<void> {
        const document = await this.openTextDocument(barrelFilePath);

        let lineToRemove: vscode.TextLine;
        let aliasLine: vscode.TextLine;

        for(let i = 1; i <= document.lineCount; i++) {
            const documentLine = document.lineAt(i);
            const lineText = documentLine.text;
            if(lineText.indexOf(statementDetails.statement) !== -1) {
                lineToRemove = documentLine;
            }

            if(lineText.indexOf('export { ') !== -1) {
                aliasLine = documentLine;
            }
        }

        if(typeof lineToRemove === 'undefined') {
            await vscode.window.showWarningMessage(`Could not find ${statementDetails.statement} in ${barrelFilePath}`);
            return;
        }

        const barrelFileUri = vscode.Uri.file(barrelFilePath);
        const workspaceEdit = new vscode.WorkspaceEdit();
        
        if(statementDetails.alias) {
            if(typeof aliasLine === 'undefined') {
                await vscode.window.showWarningMessage(`Could not find alias statement in ${barrelFilePath}`);
                return;
            }
            const newAliasText = aliasLine.text.replace(`, ${statementDetails.alias}`, '');
            workspaceEdit.replace(barrelFileUri, aliasLine.range, newAliasText);
        }
        workspaceEdit.delete(barrelFileUri, lineToRemove.range);        

        const result = await vscode.workspace.applyEdit(workspaceEdit);
        if (result) {
          await vscode.window.showInformationMessage(`The file was removed from ${barrelFilePath}`, {
            modal: false
          });

        } else {
          await vscode.window.showWarningMessage(`Unable to remove the file from ${barrelFilePath}`, {
            modal: false
          });
        }

        return;
    }

    public async showInformationMessage(message: string): Promise<string> {
        return vscode.window.showInformationMessage(message);
    }

    public async showErrorMessage(message: string): Promise<string> {
        return vscode.window.showErrorMessage(message);
    }

    public async showWarningMessage(message: string): Promise<string> {
        return vscode.window.showWarningMessage(message);
    }

    public async writeFile(filePath: string, contentLines: Array<string>): Promise<void> {
        const fileUri = vscode.Uri.file(filePath);
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.createFile(fileUri);

        for (let i = 0; i < contentLines.length; i++) {
            const line = contentLines[i];
            workspaceEdit.insert(fileUri, new vscode.Position(i, 0), `${line}\n`);
        }

        try {
            const result = await vscode.workspace.applyEdit(workspaceEdit);
            if (result === true) {
                await vscode.window.showInformationMessage(`Barrel ${filePath} was created successfully`);
            } else {
                await vscode.window.showWarningMessage('The barrel file was not created as expected');
            }
        } catch (error) {
            await vscode.window.showErrorMessage(`Creating barrel file failed:  ${error}`);
        }
    }

    private async openTextDocument(filePath: string): Promise<vscode.TextDocument> {
        const uri = vscode.Uri.file(filePath);
        return vscode.workspace.openTextDocument(uri);
    }
}