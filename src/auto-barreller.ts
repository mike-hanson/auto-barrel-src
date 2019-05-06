import * as path from 'path';

import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { IConfiguration } from './abstractions/configuration.interface';
import { IDisposable } from './abstractions/disposable.interface';
import { IUtility } from './abstractions/utlity.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';

export class AutoBarreller implements IDisposable {
    private fileSystemWatcher: IDisposable;

    constructor(private configuration: IConfiguration,
        private vsCodeApi: IVsCodeApi,
        private utility: IUtility,
        private exportStatementBuilder: IExportStatementBuilder) { }

    public async start(): Promise<void> {
        if (this.isRunning()) {
            await this.vsCodeApi.showWarningMessage('Auto Barrel is already running.');
            return;
        }

        try {
            const configuration = this.configuration.current;
            this.fileSystemWatcher = this.vsCodeApi.createFileSystemWatcher(configuration.watchGlob, this.handleFileCreated, this.handleFileDeleted);
            return Promise.resolve();
        } catch (err) {
            console.log(err);
            await this.vsCodeApi.showErrorMessage('Auto Barrel start failed, please check the console for more information.');
        }
    }

    public async stop(): Promise<void> {
        if (this.isRunning() === false) {
            await this.vsCodeApi.showWarningMessage('Auto Barrel is not running, no action taken.');
            return;
        }

        this.dispose();
        return Promise.resolve();
    }

    public dispose() {
        this.fileSystemWatcher.dispose();
        this.fileSystemWatcher = undefined;
    }


    public async handleFileCreated(filePath: string): Promise<void> {
        try {
            const extension = path.extname(filePath);
            const fileNameWithoutExtension = path.basename(filePath, extension);

            if (fileNameWithoutExtension.toLocaleLowerCase() === 'index' || this.utility.pathContainsIgnoredFragment(filePath) === true) {
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

    public async handleFileDeleted(filePath: string): Promise<void> {
        try {
            const barrelFilePath = await this.utility.findClosestBarrel(filePath);
            if (typeof barrelFilePath === 'undefined') {
                return;
            }

            const barrelFolderPath = path.dirname(barrelFilePath);
            const statementDetails = await this.exportStatementBuilder.build(barrelFolderPath, filePath);
            return this.vsCodeApi.removeStatementFromBarrel(barrelFilePath, statementDetails);

        } catch (error) {
            console.log(error);
            return Promise.reject();
        }
    }

    private isRunning(): boolean {
        return typeof this.fileSystemWatcher !== 'undefined';
    }
}