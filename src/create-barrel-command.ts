import { IVsCodeApi } from './abstractions/vs-code-api.interface';
import { IBarrelBuilder } from './abstractions/barrel-builder.interface';

export class CreateBarrelCommand {
    constructor(private vsCodeApi: IVsCodeApi,
         private barrelBuilder: IBarrelBuilder) {
    }

    public async execute(rootFolder: string): Promise<void> {
        const filePaths = await this.vsCodeApi.findSupportedFiles(rootFolder);
        const barrelDetails = await this.barrelBuilder.build(rootFolder, filePaths);

        return await this.vsCodeApi.writeFile(barrelDetails.barrelFilePath, barrelDetails.contentLines);
    }
}