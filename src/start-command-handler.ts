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

        const barrelEditor = await vscode.window.showTextDocument(
          barrelFileUri
        );
        const newLinePosition = barrelEditor.document.lineCount + 1;

        const result = await barrelEditor.edit(b => {
          b.insert(new vscode.Position(newLinePosition, 0), exportStatement);
        });

        if (result) {
          if (barrelEditor.document.isDirty) {
            await barrelEditor.document.save();
          }
          await vscode.commands.executeCommand(
            "workbench.action.closeActiveEditor"
          );
          vscode.window.showInformationMessage(
            `The new file ${fileName} was added to the barrel`
          );

          resolve();
        } else {
          vscode.window.showWarningMessage(
            `Unable to add file ${fileName} to barrel in same folder`
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

        const barrelEditor = await vscode.window.showTextDocument(
          barrelFileUri
        );

        let existingLineRange: vscode.Range | undefined = undefined;
        for (let index = 0; index < barrelEditor.document.lineCount; index++) {
          const line = barrelEditor.document.lineAt(index);
          if (line.text.indexOf(exportTarget) !== -1) {
            existingLineRange = line.rangeIncludingLineBreak;
            break;
          }
        }

        if (typeof existingLineRange !== undefined) {
          const result = await barrelEditor.edit(b => {
            b.delete(<vscode.Range>existingLineRange);
          });

          if (result) {
            if (barrelEditor.document.isDirty) {
              await barrelEditor.document.save();
            }
            await vscode.commands.executeCommand(
              "workbench.action.closeActiveEditor"
            );
            vscode.window.showInformationMessage(
              `The file import for ${fileName} was removed from the barrel`
            );

            resolve();
          } else {
            vscode.window.showWarningMessage(
              `Unable to remove import for ${fileName} from barrel in same folder`
            );

            reject();
          }
        }
      }
    });
  }
}
