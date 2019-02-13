import * as vscode from 'vscode';
import * as path from 'path';

import { Helper } from './helper';

export class CreateBarrelCommandHandler {

  private static configuration = vscode.workspace.getConfiguration('autoBarrel');

  public static async execute(resource: vscode.Uri): Promise<void> {
    const files = await vscode.workspace.findFiles(new vscode.RelativePattern(resource.path, '*.[tj]s'));

    const fileIndex = files.findIndex(f => f.path.endsWith('index.ts') || f.path.endsWith('index.js'));

    if (fileIndex !== -1) {
      vscode.window.showWarningMessage('The folder already contains a barrel file, no action taken');
      return;
    }

    const languageExtension = await CreateBarrelCommandHandler.getLanguageExtension(files);

    CreateBarrelCommandHandler.createBarrel(resource, languageExtension, files);
  }

  private static createBarrel(resource: vscode.Uri, languageExtension: string, files: vscode.Uri[]) {
    const useImportAliasExportPattern: boolean = CreateBarrelCommandHandler.configuration.get<boolean>('useImportAliasExportPattern') || false;
    const workspaceEdit = new vscode.WorkspaceEdit();
    const fileUri = vscode.Uri.file(path.join(resource.fsPath, `index.${languageExtension}`));
    workspaceEdit.createFile(fileUri);
    const aliases: string[] = [];
    let currentLine = 0;
    for (const file of files) {
      if (!file.path.endsWith(languageExtension) || Helper.pathContainsIgnoredFragment(file.path)) {
        continue;
      }
      const fileName = path.basename(file.path, `.${languageExtension}`);
      const position = new vscode.Position(currentLine++, 0);
      if (useImportAliasExportPattern) {
        const alias = Helper.buildAlias(fileName);
        aliases.push(alias);
        workspaceEdit.insert(fileUri, position, `import * as ${alias} from './${fileName}';\n`);
      }
      else {
        workspaceEdit.insert(fileUri, position, `export * from './${fileName}';\n`);
      }
    }

    if (useImportAliasExportPattern) {
      const position = new vscode.Position(currentLine++, 0);
      workspaceEdit.insert(fileUri, position, `\nexport { ${aliases.join(', ')} };`);
    }

    vscode.workspace.applyEdit(workspaceEdit).then(
      r => {
        if (r) {
          vscode.window.showInformationMessage(`Barrel file index.${languageExtension} created successfully`);
        } else {
          vscode.window.showWarningMessage('The barrel file was not created as expected');
        }
      },
      reason => vscode.window.showErrorMessage(`Creating barrel file failed:  ${reason}`)
    );
  }

  private static getLanguageExtension(files: vscode.Uri[]): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
      const defaultLanguageExtension: string = CreateBarrelCommandHandler.configuration.get<string>('defaultLanguageExtension') || 'ts';
      const alwaysUseDefaultLanguageExtension: boolean =
        CreateBarrelCommandHandler.configuration.get<boolean>('alwaysUseDefaultLanguageExtension') || false;

      if (alwaysUseDefaultLanguageExtension === true) {
        resolve(defaultLanguageExtension);
      } else {
        let languageExtension: string | undefined = undefined;
        if (files.every(f => f.path.endsWith('.ts'))) {
          languageExtension = 'ts';
        } else if (files.every(f => f.path.endsWith('.js'))) {
          languageExtension = 'js';
        }

        if (typeof languageExtension === 'undefined') {
          resolve(defaultLanguageExtension);
        } else {
          resolve(languageExtension);
        }
      }
    });
  }
}
