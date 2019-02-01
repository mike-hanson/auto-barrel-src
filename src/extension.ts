import * as vscode from "vscode";

import { CreateBarrelCommandHandler } from "./create-barrel-command-handler";
import { StartCommandHandler } from "./start-command-handler";

let fileSystemWatcher: vscode.FileSystemWatcher | undefined;

export function activate(context: vscode.ExtensionContext) {
  const createBarrelCommand = vscode.commands.registerCommand(
    "autoBarrel.createBarrel",
    CreateBarrelCommandHandler.execute
  );

  const startCommand = vscode.commands.registerCommand(
    "autoBarrel.start",
    () => {
      if (typeof fileSystemWatcher !== "undefined") {
        vscode.window.showInformationMessage("Auto Barrel is already running.");
        return;
      }
      const watchGlob =
        vscode.workspace
          .getConfiguration("autoBarrel")
          .get<string>("watchGlob") || "**/src/**/*!(.spec).[tj]s";
      fileSystemWatcher = vscode.workspace.createFileSystemWatcher(
        watchGlob,
        false,
        true,
        false
      );
      fileSystemWatcher.onDidCreate(StartCommandHandler.handleFileAdded);
      fileSystemWatcher.onDidDelete(StartCommandHandler.handleFileDeleted);
    }
  );

  const stopCommand = vscode.commands.registerCommand("autoBarrel.stop", () => {
    if (typeof fileSystemWatcher !== "undefined") {
      fileSystemWatcher.dispose();
      fileSystemWatcher = undefined;
    } else {
      vscode.window.showInformationMessage(
        "Auto Barrel is not running, no action taken."
      );
    }
  });

  context.subscriptions.push(createBarrelCommand);
  context.subscriptions.push(startCommand);
  context.subscriptions.push(stopCommand);
}

export function deactivate() {
  if (typeof fileSystemWatcher !== "undefined") {
    fileSystemWatcher.dispose();
  }
}
