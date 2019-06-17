import { BarrelDetails } from './models/barrel-details';
import { IUtility } from './abstractions/utlity.interface';
import { IBarrelBuilder } from './abstractions/barrel-builder.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';
import { StatementDetails } from './models/statement-details';

export class BarrelBuilder implements IBarrelBuilder {

    constructor(private utility: IUtility,
        private exportStatementBuilder: IExportStatementBuilder) {
    }

    public async build(rootFolderPath: string, filePaths: Array<string>): Promise<BarrelDetails> {
        const languageExtension = this.utility.getLanguageExtension(filePaths);
        const aliases: Array<string> = [];
        const result = new Array<string>();
        const exportStatements = new Array<StatementDetails>();

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];

            if (!this.utility.shouldBeIncludedInBarrel(filePath, languageExtension)) {
                continue;
            }

            const exportStatement = await this.exportStatementBuilder.build(rootFolderPath, filePath);
            exportStatements.push(exportStatement);
        }

        for(let i = 0; i < exportStatements.length; i++) {
           const exportStatement = exportStatements[i];
            if (!barrelForStatementIsIncluded(exportStatement)) {
                result.push(exportStatement.statement);
                if (exportStatement.alias) {
                    aliases.push(exportStatement.alias);
                }
            }
        }

        if (aliases.length) {
            result.push(`export { ${aliases.join(', ')} };`);
        }

        return {
            barrelFilePath: `${rootFolderPath}/index.${languageExtension}`,
            contentLines: result
        };

        function barrelForStatementIsIncluded(statementDetails: StatementDetails) {
            if(statementDetails.isBarrelImport) {
                return false;
            }

            const statement = statementDetails.statement;
            const start = statement.indexOf('from');
            const length = statement.lastIndexOf('/') - start;
            const barrelImportSuffix = `${statement.substr(start, length)}'`;
            
            const barrelImport = exportStatements.find((s) => s.statement.indexOf(barrelImportSuffix) !== -1);
            return typeof barrelImport !== 'undefined';
        }
    }
}