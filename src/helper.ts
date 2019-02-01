import * as vscode from 'vscode';

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
}
