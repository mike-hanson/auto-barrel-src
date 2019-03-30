import * as vscode from 'vscode';

import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { AutoBarrelSettings } from './models/auto-barrel-settings';
import { defaultSettings } from './default-settings';

export class VsCodeApi implements IVsCodeApi {
    public async findFiles(folderPath: string): Promise<Array<string>> {
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.{js,jsx,ts,tsx}'));
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
        }

        function getSettingOrDefault<T extends string | boolean>(config: vscode.WorkspaceConfiguration, section: string): T {
            const configSetting = config.get<T>(section);
            if (typeof configSetting !== 'undefined') {
                return configSetting as T;
            }
            return defaultSettings[section] as T;
        }
    }

    public async openTextDocument(filePath: string): Promise<string> {
        const uri = vscode.Uri.file(filePath);
        const document = await vscode.workspace.openTextDocument(uri);
        return document.getText();
    }

    public async writeFile(filePath: string, contentLines: Array<string>): Promise<void> {
        const fileUri = vscode.Uri.file(filePath);
        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.createFile(fileUri);

        for (let i = 0; i < contentLines.length; i++) {
            const line = contentLines[i];
            workspaceEdit.insert(fileUri, new vscode.Position(i, 0), line);
        }

        try {
            const result = await vscode.workspace.applyEdit(workspaceEdit);
            if (result === true) {
                await vscode.window.showInformationMessage(`Barrel file ${filePath} created successfully`);
            } else {
                await vscode.window.showWarningMessage('The barrel file was not created as expected');
            }
        } catch (error) {
            await vscode.window.showErrorMessage(`Creating barrel file failed:  ${error}`);
        }
    }
}