import { BarrelDetails } from './models/barrel-details';
import { IUtility } from './abstractions/utlity.interface';
import { IBarrelBuilder } from './abstractions/barrel-builder.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';

export class BarrelBuilder implements IBarrelBuilder {

    constructor(private utility: IUtility,
        private exportStatementBuilder: IExportStatementBuilder) {
    }

    public async build(rootFolderPath: string, filePaths: Array<string>): Promise<BarrelDetails> {
        const languageExtension = this.utility.getLanguageExtension(filePaths);
        const aliases: Array<string> = [];
        const result = new Array<string>();

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];

            if (!this.utility.shouldBeIncludedInBarrel(filePath, languageExtension)) {
                continue;
            }

            const statementDetails = await this.exportStatementBuilder.build(rootFolderPath, filePath);
            result.push(statementDetails.statement);
            if(statementDetails.alias){
                aliases.push(statementDetails.alias);
            }
        }

        if (aliases.length) {
            result.push(`export { ${aliases.join(', ')} };`);
        }

        return {
            barrelFilePath: `${rootFolderPath}/index.${languageExtension}`,
            contentLines: result
        };
    }
}