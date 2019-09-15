import * as path from 'path';

import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { IBarrelBuilder } from './abstractions/barrel-builder.interface';

export class UpdateBarrelCommand {
  constructor(private vsCodeApi: IVsCodeApi, private barrelBuilder: IBarrelBuilder) {}

  public async execute(barrelFilePath: string): Promise<void> {
    const rootFolder = path.dirname(barrelFilePath);
    const filePaths = await this.vsCodeApi.findSupportedFiles(rootFolder);
    const barrelFileIndex = filePaths.indexOf(barrelFilePath);
    if (barrelFileIndex !== -1) {
      filePaths.splice(barrelFileIndex, 1);
    }
    const barrelDetails = await this.barrelBuilder.build(rootFolder, filePaths);

    return await this.vsCodeApi.overwriteFileContent(barrelDetails.barrelFilePath, barrelDetails.contentLines);
  }
}
