import * as vscode from 'vscode';
import * as path from 'path';

import { Helper } from './helper';

export class StartCommandHandler {

  private static readonly importPrefix = 'import *';

  public static async handleFileAdded(uri: vscode.Uri): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const fileName = path.basename(uri.fsPath);
      const extension = path.extname(uri.fsPath);
      const fileNameWithoutExtension = path.basename(uri.fsPath, extension);

      if (fileNameWithoutExtension.toLowerCase() === 'index' || Helper.pathContainsIgnoredFragment(uri.fsPath)) {
        resolve();
        return;
      }

      const barrelFileUri = await Helper.findClosestBarrel(uri);

      if (typeof barrelFileUri === 'undefined') {
        resolve();
      } else {
        const document = await vscode.workspace.openTextDocument(barrelFileUri);
        if (document.lineCount >= 1) {
          if (document.lineAt(0).text.indexOf('auto-barrel-ignore') !== -1) {
            resolve();
            return;
          }
        }
        const relativeFilePath = path.relative(barrelFileUri.path, uri.path).replace(/\\/g, '/').replace('../', './').replace(extension, '');
        const workspaceEdit = new vscode.WorkspaceEdit();
        const isUsingImportAliasExportPattern = document.getText().indexOf(StartCommandHandler.importPrefix) !== -1;
        if (!isUsingImportAliasExportPattern) {
          let exportStatement: string;
          const exportsAsDefault = await Helper.containsDefaultExport(uri);
          if (exportsAsDefault) {
            exportStatement = `export { default as ${fileNameWithoutExtension} } from '${relativeFilePath}';\n`;
          }
          else {
            exportStatement = `export * from '${relativeFilePath}';\n`;
          }
          const newLinePosition = document.lineCount + 1;
          workspaceEdit.insert(barrelFileUri, new vscode.Position(newLinePosition, 0), exportStatement);
        }
        else {
          const alias = Helper.buildAlias(fileNameWithoutExtension);

          const importStatement = `import * as ${alias} from '${relativeFilePath}';\n`;
          let newLinePosition = 0;
          let exportLine: vscode.TextLine | any;

          for (let i = 0; i < document.lineCount; i++) {
            if (document.lineAt(i).isEmptyOrWhitespace) {
              newLinePosition = i;
              continue;
            }

            if (document.lineAt(i).text.indexOf(StartCommandHandler.importPrefix) !== -1) {
              exportLine = document.lineAt(i);
              break;
            }
          }


          const exportStatement = exportLine.text || '';
          const newExportStatement = exportStatement.replace(' };', `, ${alias} };`);

          workspaceEdit.replace(barrelFileUri, exportLine.range, newExportStatement);
          workspaceEdit.insert(barrelFileUri, new vscode.Position(newLinePosition, 0), importStatement);
        }
        const result = await vscode.workspace.applyEdit(workspaceEdit);

        const barrelRelativePath = path.relative(uri.path, barrelFileUri.path).replace(/\\/g, '/');
        if (result) {
          vscode.window.showInformationMessage(`The new file ${fileName} was added to the barrel ${barrelRelativePath}`, {
            modal: false
          });

          resolve();
        } else {
          vscode.window.showWarningMessage(`Unable to add file ${fileName} to barrel ${barrelRelativePath}`, {
            modal: false
          });

          reject();
        }
      }
    });
  }
  public static async handleFileDeleted(uri: vscode.Uri): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const fileName = path.basename(uri.fsPath);
      const extension = path.extname(uri.fsPath);
      const fileNameWithoutExtension = path.basename(uri.fsPath, extension);

      const barrelFileUri = await Helper.findClosestBarrel(uri);

      if (typeof barrelFileUri === 'undefined') {
        resolve();
      } else {
        const exportTarget = path.relative(barrelFileUri.path, uri.path).replace(/\\/g, '/').replace('../', './').replace(extension, '');

        const document = await vscode.workspace.openTextDocument(barrelFileUri);

        let existingLineRange: vscode.Range | undefined = undefined;
        let exportLine: vscode.TextLine | undefined = undefined;
        for (let index = 0; index < document.lineCount; index++) {
          const line = document.lineAt(index);
          if (line.text.indexOf(exportTarget) !== -1) {
            existingLineRange = line.rangeIncludingLineBreak;
            continue;
          }

          if (line.text.indexOf(StartCommandHandler.importPrefix) !== -1) {
            exportLine = line;
            break;
          }
        }

        if (typeof existingLineRange !== undefined) {
          const workspaceEdit = new vscode.WorkspaceEdit();

          if (typeof exportLine !== 'undefined') {
            const alias = Helper.buildAlias(fileNameWithoutExtension);
            const exportStatement = exportLine.text;
            const newExportStatement = exportStatement.replace(`, ${alias}`, '');

            workspaceEdit.replace(barrelFileUri, exportLine.range, newExportStatement);
          }

          workspaceEdit.delete(barrelFileUri, <vscode.Range>existingLineRange);
          const result = await vscode.workspace.applyEdit(workspaceEdit);
          const barrelRelativePath = path.relative(uri.path, barrelFileUri.path).replace(/\\/g, '/');

          if (result) {
            vscode.window.showInformationMessage(
              `The file import for ${fileName} was removed from the barrel ${barrelRelativePath}`
            );

            resolve();
          } else {
            vscode.window.showWarningMessage(
              `Unable to remove import for ${fileName} from the barrel ${barrelRelativePath} in the same folder`
            );

            reject();
          }
        }
      }
    });
  }
}

export default {prop: 1};