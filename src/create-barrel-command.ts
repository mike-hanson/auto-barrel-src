import { VsCodeApi } from './vs-code-api';
import { BarrelBuilder } from './barrel-builder';

export class CreateBarrelCommand {
    constructor(private vsCodeApi: VsCodeApi,
         private barrelBuilder: BarrelBuilder) {
    }

    public async execute(rootFolder: string): Promise<void> {
        const filePaths = await this.vsCodeApi.findFiles(rootFolder);
        const barrelDetails = await this.barrelBuilder.build(rootFolder, filePaths);

        return this.vsCodeApi.writeFile(barrelDetails.barrelFilePath, barrelDetails.contentLines);
    }
}