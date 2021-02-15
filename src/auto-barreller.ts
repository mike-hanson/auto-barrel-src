import * as path from 'path';

import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { IDisposable } from './abstractions/disposable.interface';
import { IUtility } from './abstractions/utlity.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';

export class AutoBarreller implements IDisposable {
  private fileSystemWatcher: IDisposable;

  constructor(
    private vsCodeApi: IVsCodeApi,
    private utility: IUtility,
    private exportStatementBuilder: IExportStatementBuilder
  ) {}

  public start = async (): Promise<void> => {
    if (this.isRunning()) {
      await this.vsCodeApi.showWarningMessage('Auto Barrel is already running.');
      return;
    }

    try {
      const configuration = this.vsCodeApi.getConfiguration();
      this.fileSystemWatcher = this.vsCodeApi.createFileSystemWatcher(
        configuration.watchGlob,
        this.handleFileCreated,
        this.handleFileDeleted
      );
      await this.vsCodeApi.showInformationMessage('Auto Barrel was started successfully.');
      return Promise.resolve();
    } catch (err) {
      console.log(err);
      await this.vsCodeApi.showErrorMessage('Auto Barrel start failed, please check the console for more information.');
    }
  }

  public stop = async (): Promise<void> => {
    if (this.isRunning() === false) {
      await this.vsCodeApi.showWarningMessage('Auto Barrel is not running, no action taken.');
      return;
    }

    this.dispose();
    return Promise.resolve();
  }

  public dispose = () => {
    this.fileSystemWatcher.dispose();
    this.fileSystemWatcher = undefined;
  }

  public handleFileCreated = async (filePath: string): Promise<void> => {
    try {
      if (this.utility.pathContainsIgnoredFragment(filePath) === true) {
        return Promise.resolve();
      }

      const barrelFilePath = await this.utility.findClosestBarrel(filePath);
      if (typeof barrelFilePath === 'undefined') {
        return;
      }

      const languageExtension = path.extname(barrelFilePath).substr(1);
      if (this.utility.shouldBeIncludedInBarrel(filePath, languageExtension) === false) {
        return;
      }

      const barrelFolderPath = path.dirname(barrelFilePath);
      const statementDetails = await this.exportStatementBuilder.build(barrelFolderPath, filePath);
      return this.vsCodeApi.appendStatementToBarrel(barrelFilePath, statementDetails);
    } catch (error) {
      console.log(error);
      return Promise.reject();
    }
  }

  public handleFileDeleted = async (filePath: string): Promise<void> => {
    try {
      const barrelFilePath = await this.utility.findClosestBarrel(filePath);
      if (typeof barrelFilePath === 'undefined') {
        return;
      }

      const barrelFolderPath = path.dirname(barrelFilePath);
      const fileExtension = path.extname(filePath);
      let fileRelativePath = path
        .relative(barrelFolderPath, filePath)
        .replace(/\\/g, '/')
        .replace(fileExtension, '');
      const statementSuffix = `from './${fileRelativePath}'`;
      return this.vsCodeApi.removeStatementFromBarrel(barrelFilePath, statementSuffix);
    } catch (error) {
      console.log(error);
      return Promise.reject();
    }
  }

  private isRunning(): boolean {
    return typeof this.fileSystemWatcher !== 'undefined';
  }
}
