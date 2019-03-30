import * as vscode from 'vscode';
import * as path from 'path';

export class Helper {
  private static supportedExtensions: { [index: string]: string[]; js: string[]; ts: string[]; } = {
    js: ['.js', '.jsx'],
    ts: ['.ts', '.tsx']
  };

  public static pathContainsIgnoredFragment(path: string): boolean {
    const ignoredFragmentsSetting =
      vscode.workspace.getConfiguration('autoBarrel').get<string>('ignoreFilePathContainingAnyOf') || undefined;
    if (ignoredFragmentsSetting) {
      const fragments = ignoredFragmentsSetting.split(',');
      if (fragments && fragments.length) {
        for (const fragment of fragments) {
          if (path.indexOf(fragment) !== -1) {
            return true;
          }
        }
      }
    }
    return false;
  }

  public static shouldBeIncludedInBarrel(filePath: string, languageExtension: string): boolean {
    const possibleExtensions = Helper.supportedExtensions[languageExtension];
    const extension = path.extname(filePath);

    return possibleExtensions.indexOf(extension) !== -1 && !Helper.pathContainsIgnoredFragment(filePath);
  }

  public static buildAlias(fileName: string): string {
    const actualFileName = path.basename(fileName);
    const aliasParts: string[] = [];

    const fileNameParts = actualFileName.split('.');
    for (const part of fileNameParts) {
      const partElements = part.split('-');
      for (const element of partElements) {
        aliasParts.push(element.charAt(0).toUpperCase() + element.slice(1));
      }
    }

    return aliasParts.join('');
  }

  public static async containsDefaultExport(uri: vscode.Uri): Promise<boolean> {
    const document = await vscode.workspace.openTextDocument(uri);
    return document.getText().indexOf('export default') !== -1;
  }

  public static async findClosestBarrel(uri: vscode.Uri): Promise<vscode.Uri | undefined> {

    return new Promise<vscode.Uri | undefined>(async (resolve, reject) => {

      const fileExtension = path.extname(uri.fsPath).substr(0, 3);
      const disableRecursiveBarrelling = vscode.workspace.getConfiguration('autoBarrel').get<boolean>('disableRecursiveBarrelling') || false;

      if (disableRecursiveBarrelling === true) {
        const folderPath = path.dirname(uri.fsPath);
        const barrelFileName = `index${fileExtension}`;
        const barrelFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(folderPath, barrelFileName));
        if (barrelFiles.length === 0) {
          resolve(undefined);
        } else {
          resolve(barrelFiles[0]);
        }
      } else {
        const watchGlob = vscode.workspace.getConfiguration('autoBarrel').get<string>('watchGlob') || '**/src/**/*.{js,jsx,ts,tsx}';
        const lastSlashIndex = watchGlob.lastIndexOf('/');
        const searchGlobBase = lastSlashIndex === -1 ? watchGlob : watchGlob.substr(0, lastSlashIndex + 1);
        const searchGlob = `${searchGlobBase}**/index${fileExtension}`;
        const barrelFiles = await vscode.workspace.findFiles(searchGlob);
        if (barrelFiles.length === 0) {
          resolve(undefined);
        } else {
          barrelFiles.sort((a: vscode.Uri, b: vscode.Uri) => {
            return a.fsPath.length - b.fsPath.length;
          });
          resolve(barrelFiles[0]);
        }
      }
    });
  }
}
