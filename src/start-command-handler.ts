import * as vscode from "vscode";
import * as path from "path";

export class StartCommandHandler {
  public static async handleFileAdded(uri: vscode.Uri): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const folderPath = path.dirname(uri.fsPath);
      const fileName = path.basename(uri.fsPath);
      const extension = path.extname(uri.fsPath);
      const fileNameWithoutExtension = path.basename(uri.fsPath, extension);
      const barrelFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folderPath, `index${extension}`)
      );

      if (barrelFiles.length === 0) {
        resolve();
      } else {
        const barrelFileUri = vscode.Uri.file(
          path.join(folderPath, `index${extension}`)
        );
        const exportStatement = `export * from './${fileNameWithoutExtension}';\n`;

        const document = await vscode.workspace.openTextDocument(barrelFileUri);
        if (document.lineCount >= 1) {
          if (document.lineAt(0).text.indexOf("auto-barrel-ignore") !== -1) {
            resolve();
            return;
          }
        }
        const newLinePosition = document.lineCount + 1;

        const workspaceEdit = new vscode.WorkspaceEdit();
        workspaceEdit.insert(
          barrelFileUri,
          new vscode.Position(newLinePosition, 0),
          exportStatement
        );
        const result = await vscode.workspace.applyEdit(workspaceEdit);

        if (result) {
          vscode.window.showInformationMessage(
            `The new file ${fileName} was added to the barrel index${extension}`,
            { modal: false }
          );

          resolve();
        } else {
          vscode.window.showWarningMessage(
            `Unable to add file ${fileName} to barrel index${extension}`,
            { modal: false }
          );

          reject();
        }
      }
    });
  }
  public static async handleFileDeleted(uri: vscode.Uri): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      const folderPath = path.dirname(uri.fsPath);
      const fileName = path.basename(uri.fsPath);
      const extension = path.extname(uri.fsPath);
      const fileNameWithoutExtension = path.basename(uri.fsPath, extension);
      const barrelFiles = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folderPath, `index${extension}`)
      );

      if (barrelFiles.length === 0) {
        resolve();
      } else {
        const barrelFileUri = vscode.Uri.file(
          path.join(folderPath, `index${extension}`)
        );
        const exportTarget = `./${fileNameWithoutExtension}`;

        const document = await vscode.workspace.openTextDocument(barrelFileUri);

        let existingLineRange: vscode.Range | undefined = undefined;
        for (let index = 0; index < document.lineCount; index++) {
          const line = document.lineAt(index);
          if (line.text.indexOf(exportTarget) !== -1) {
            existingLineRange = line.rangeIncludingLineBreak;
            break;
          }
        }

        if (typeof existingLineRange !== undefined) {
          const workspaceEdit = new vscode.WorkspaceEdit();
          workspaceEdit.delete(barrelFileUri, <vscode.Range>existingLineRange);
          const result = await vscode.workspace.applyEdit(workspaceEdit);

          if (result) {
            vscode.window.showInformationMessage(
              `The file import for ${fileName} was removed from the barrel index${extension}`
            );

            resolve();
          } else {
            vscode.window.showWarningMessage(
              `Unable to remove import for ${fileName} from the barrel index${extension} in the same folder`
            );

            reject();
          }
        }
      }
    });
  }
}
