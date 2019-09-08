import * as vscode from 'vscode';

import { container } from './container';
import { CreateBarrelCommand } from './create-barrel-command';
import { UpdateBarrelCommand } from './update-barrel-command';
import { AutoBarreller } from './auto-barreller';

let autoBarreller: AutoBarreller;

export function activate(context: vscode.ExtensionContext) {
  autoBarreller = container.resolve<AutoBarreller>('autoBarreller');
  const createBarrelCommandHandler: CreateBarrelCommand = container.resolve<CreateBarrelCommand>('createBarrelCommand');
  const updateBarrelCommandHandler: UpdateBarrelCommand = container.resolve<UpdateBarrelCommand>('updateBarrelCommand');

  const createBarrelCommand = vscode.commands.registerCommand('autoBarrel.createBarrel', (uri: vscode.Uri) =>
    createBarrelCommandHandler.execute(uri.path)
  );

  const updateBarrelCommand = vscode.commands.registerCommand('autoBarrel.updateBarrel', (uri: vscode.Uri) =>
    updateBarrelCommandHandler.execute(uri.path)
  );

  const startCommand = vscode.commands.registerCommand('autoBarrel.start', autoBarreller.start);
  const stopCommand = vscode.commands.registerCommand('autoBarrel.stop', autoBarreller.stop);

  context.subscriptions.push(createBarrelCommand);
  context.subscriptions.push(updateBarrelCommand);
  context.subscriptions.push(startCommand);
  context.subscriptions.push(stopCommand);
}

export function deactivate() {
  if (typeof autoBarreller !== 'undefined') {
    autoBarreller.dispose();
  }
}
