import * as vscode from 'vscode';
import * as path from 'path';

export class Helper {
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
}
