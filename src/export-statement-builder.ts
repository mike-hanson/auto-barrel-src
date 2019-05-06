import * as path from 'path';

import { StatementDetails } from './models/statement-details';
import { IUtility } from './abstractions/utlity.interface';
import { IConfiguration } from './abstractions/configuration.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';

export class ExportStatementBuilder implements IExportStatementBuilder {
    constructor(private utility: IUtility,
        private configuration: IConfiguration) { }

    public async build(rootFolderPath:string, filePath: string): Promise<StatementDetails> {
        const config = this.configuration.current;
        const result: StatementDetails = {
            statement: undefined,
            alias: undefined
        };

        const fileExtension = path.extname(filePath);
        const fileName = path.basename(filePath, fileExtension);
        const fileRelativePath = path.relative(rootFolderPath, filePath).replace(/\\/g, '/').replace(fileExtension, '');
        if (config.useImportAliasExportPattern) {
            result.alias = this.utility.buildAlias(filePath);
            result.statement = `import * as ${result.alias} from './${fileRelativePath}';`;
        } else {
            const containsDefaultExport = await this.utility.containsDefaultExport(filePath);
            if (containsDefaultExport === true) {
                result.statement = `export { default as ${fileName} } from './${fileRelativePath}';`;
            } else {
                result.statement = `export * from './${fileRelativePath}';`;
            }
        }

        return result;
    }
}