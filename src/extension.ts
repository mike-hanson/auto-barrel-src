import * as vscode from 'vscode';

import { container } from './container';
import { CreateBarrelCommand } from './create-barrel-command';
import { AutoBarreller } from './auto-barreller';

let autoBarreller: AutoBarreller;

export function activate(context: vscode.ExtensionContext) {
  autoBarreller = container.resolve<AutoBarreller>('autoBarreller');
  const createBarrelCommandHandler: CreateBarrelCommand = container.resolve<CreateBarrelCommand>('createBarrelCommand');

  const createBarrelCommand = vscode.commands.registerCommand(
    'autoBarrel.createBarrel',
    (uri: vscode.Uri) => createBarrelCommandHandler.execute(uri.path)
  );

  const createBarrelAtCommand = vscode.commands.registerCommand('autoBarrel.createBarrelAt', async () => {
    const folderPath = await vscode.window.showInputBox({
      prompt: 'Enter Folder Path'
    });
    const uri = vscode.Uri.parse(folderPath);
    return createBarrelCommandHandler.execute(uri.path);
  })

  const startCommand = vscode.commands.registerCommand('autoBarrel.start', autoBarreller.start);
  const stopCommand = vscode.commands.registerCommand('autoBarrel.stop', autoBarreller.stop);

  context.subscriptions.push(createBarrelCommand);
  context.subscriptions.push(createBarrelAtCommand);
  context.subscriptions.push(startCommand);
  context.subscriptions.push(stopCommand);
}

export function deactivate() {
  if (typeof autoBarreller !== 'undefined') {
    autoBarreller.dispose();
  }
}
