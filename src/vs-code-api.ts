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

    let lastLineWithContent = document.lineCount - 1;
    for (let i = lastLineWithContent; i > 0; i--) {
      if (document.lineAt(i).text.length) {
        lastLineWithContent = i;
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

    if (statementDetails.isBarrelImport) {
      const barrelStatementPrefix = statementDetails.statement.substr(0, statementDetails.statement.length - 2);
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.indexOf(barrelStatementPrefix) !== -1) {
          workspaceEdit.delete(barrelFileUri, line.rangeIncludingLineBreak);
        }
      }
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

  public createFileSystemWatcher(
    globPattern: string,
    onCreated: (path: string) => void,
    onDelete: (path: string) => void
  ): IDisposable {
    const relativeGlobPattern = new vscode.RelativePattern(vscode.workspace.rootPath, globPattern);
    const result = vscode.workspace.createFileSystemWatcher(relativeGlobPattern, false, true, false);

    result.onDidCreate((uri: vscode.Uri) => {
      onCreated(uri.path);
    });
    result.onDidDelete((uri: vscode.Uri) => onDelete(uri.path));

    return result;
  }

  public async findSupportedFiles(folderPath: string): Promise<Array<string>> {
    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, '**/*.{js,jsx,ts,tsx,vue}'));
    const filePaths = files.map(f => f.path);
    filePaths.sort();
    return filePaths;
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
      disableRecursiveBarrelling: getSettingOrDefault<boolean>(config, 'disableRecursiveBarrelling'),
      excludeSemiColonAtEndOfLine: getSettingOrDefault<boolean>(config, 'excludeSemiColonAtEndOfLine'),
      includeExtensionOnExport: getSettingOrDefault<string>(config, 'includeExtensionOnExport')
    };

    function getSettingOrDefault<T extends string | boolean>(
      config: vscode.WorkspaceConfiguration,
      section: string
    ): T {
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

  public async removeStatementFromBarrel(barrelFilePath: string, statementSuffix: string): Promise<void> {
    const document = await this.openTextDocument(barrelFilePath);

    let lineToRemove: vscode.TextLine;
    let aliasLine: vscode.TextLine;

    for (let i = 0; i < document.lineCount; i++) {
      const documentLine = document.lineAt(i);
      const lineText = documentLine.text;
      if (lineText.indexOf(statementSuffix) !== -1) {
        lineToRemove = documentLine;
      }

      if (lineText.indexOf('export { ') !== -1) {
        aliasLine = documentLine;
      }
    }

    if (typeof lineToRemove === 'undefined') {
      await vscode.window.showWarningMessage(`Could not find ${statementSuffix} in ${barrelFilePath}`);
      return;
    }

    const barrelFileUri = vscode.Uri.file(barrelFilePath);
    const workspaceEdit = new vscode.WorkspaceEdit();

    if (lineToRemove.text.indexOf('import * as ') !== -1) {
      if (typeof aliasLine === 'undefined') {
        await vscode.window.showWarningMessage(`Could not find alias statement in ${barrelFilePath}`);
        return;
      }
      const alias = lineToRemove.text.split(' ')[3];
      const newAliasText = aliasLine.text.replace(`, ${alias}`, '');
      workspaceEdit.replace(barrelFileUri, aliasLine.range, newAliasText);
    }
    workspaceEdit.delete(barrelFileUri, lineToRemove.rangeIncludingLineBreak);

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

  public async writeFile(
    filePath: string,
    contentLines: Array<string>,
    overWriteIfExists: boolean = false
  ): Promise<void> {
    const fileUri = vscode.Uri.file(filePath);
    const workspaceEdit = new vscode.WorkspaceEdit();
    workspaceEdit.createFile(fileUri, { overwrite: overWriteIfExists });

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

  public async overwriteFileContent(filePath: string, contentLines: Array<string>) {
    const document = await this.openTextDocument(filePath);
    const fileUri = vscode.Uri.file(filePath);
    const workspaceEdit = new vscode.WorkspaceEdit();

    for (let i = 0; i < contentLines.length; i++) {
      const contentLine = contentLines[i];
      if (i < document.lineCount) {
        workspaceEdit.replace(fileUri, document.lineAt(i).rangeIncludingLineBreak, `${contentLine}\n`);
      } else {
        workspaceEdit.insert(fileUri, new vscode.Position(i, 0), `${contentLine}\n`);
      }
    }

    if (document.lineCount > contentLines.length) {
      for (let i = contentLines.length; i < document.lineCount; i++) {
        const lineRange = document.lineAt(i).rangeIncludingLineBreak;
        workspaceEdit.delete(fileUri, lineRange);
      }
    }

    try {
      const result = await vscode.workspace.applyEdit(workspaceEdit);
      if (result === true) {
        await vscode.window.showInformationMessage(`Barrel ${filePath} was updated successfully`);
      } else {
        await vscode.window.showWarningMessage('The barrel file was not updated as expected');
      }
    } catch (error) {
      await vscode.window.showErrorMessage(`Updating barrel failed:  ${error}`);
    }
  }

  private async openTextDocument(filePath: string): Promise<vscode.TextDocument> {
    const uri = vscode.Uri.file(filePath);
    return vscode.workspace.openTextDocument(uri);
  }
}
