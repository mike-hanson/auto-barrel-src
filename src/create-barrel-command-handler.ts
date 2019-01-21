import * as vscode from "vscode";

export class CreateBarrelCommandHandler {
  public static async execute(resource: vscode.Uri): Promise<void> {
    const files = await vscode.workspace.findFiles(
      new vscode.RelativePattern(resource.path, "*.[tj]s")
    );

    const fileIndex = files.findIndex(
      f => f.path.endsWith("index.ts") || f.path.endsWith("index.js")
    );

    if (fileIndex !== -1) {
      vscode.window.showWarningMessage(
        "The folder already contains a barrel file, no action taken"
      );
      return;
    }

    const languageExtension = await CreateBarrelCommandHandler.getLanguageExtension(
      files
    );

    CreateBarrelCommandHandler.createBarrel(resource, languageExtension, files);
  }

  private static createBarrel(
    resource: vscode.Uri,
    languageExtension: string,
    files: vscode.Uri[]
  ) {
    const workspaceEdit = new vscode.WorkspaceEdit();
    const fileUri = vscode.Uri.file(
      `${resource.fsPath}\\index.${languageExtension}`
    );
    workspaceEdit.createFile(fileUri);
    let currentLine = 0;
    for (const file of files) {
      if (!file.path.endsWith(languageExtension)) {
        continue;
      }
      const fileNameStart = file.path.lastIndexOf("/") + 1;
      const fileNameEnd = file.path.lastIndexOf(".");
      const fileName = file.path.substring(fileNameStart, fileNameEnd);
      const position = new vscode.Position(currentLine++, 0);
      workspaceEdit.insert(
        fileUri,
        position,
        `export * from './${fileName}';\n`
      );
    }
    vscode.workspace.applyEdit(workspaceEdit).then(
      r => {
        if (r) {
          vscode.window.showInformationMessage(
            `Barrel file index.${languageExtension} created successfully`
          );
        } else {
          vscode.window.showWarningMessage(
            "The barrel file was not created as expected"
          );
        }
      },
      reason =>
        vscode.window.showErrorMessage(
          `Creating barrel file failed:  ${reason}`
        )
    );
  }

  private static getLanguageExtension(files: vscode.Uri[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      const configuration = vscode.workspace.getConfiguration("autoBarrel");
      const defaultLanguageExtension: string =
        configuration.get<string>("defaultLanguageExtension") || "ts";
      const alwaysUseDefaultLanguageExtension: boolean =
        configuration.get<boolean>("alwaysUseDefaultLanguageExtension") ||
        false;

      if (alwaysUseDefaultLanguageExtension === true) {
        resolve(defaultLanguageExtension);
      } else {
        let languageExtension: string | undefined = undefined;
        if (files.every(f => f.path.endsWith(".ts"))) {
          languageExtension = "ts";
        } else if (files.every(f => f.path.endsWith(".js"))) {
          languageExtension = "js";
        }

        if (typeof languageExtension === "undefined") {
          resolve(defaultLanguageExtension);
        } else {
          resolve(languageExtension);
        }
      }
    });
  }
}
