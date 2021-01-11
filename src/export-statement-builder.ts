import * as path from 'path';

import { StatementDetails } from './models/statement-details';
import { IUtility } from './abstractions/utlity.interface';
import { IConfiguration } from './abstractions/configuration.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';

export class ExportStatementBuilder implements IExportStatementBuilder {
  constructor(private utility: IUtility, private configuration: IConfiguration) {}

  public async build(rootFolderPath: string, filePath: string): Promise<StatementDetails> {
    const config = this.configuration.current;
    const result: StatementDetails = {
      statement: undefined,
      alias: undefined,
      isBarrelImport: false
    };

    const fileExtension = path.extname(filePath);
    let baseName = path.basename(filePath, fileExtension);
    let importRelativePath = path
      .relative(rootFolderPath, filePath)
      .replace(/\\/g, '/')
      .replace(fileExtension, '');

    if (baseName.toLowerCase() === 'index') {
      importRelativePath = importRelativePath.replace('/index', '');
      baseName = importRelativePath.substr(baseName.lastIndexOf('/') + 1);
      result.isBarrelImport = true;
    }
    if (config.useImportAliasExportPattern) {
      result.alias = this.utility.buildAlias(filePath);
      result.statement = `import * as ${result.alias} from './${importRelativePath}';`;
    } else {
      const containsDefaultExport = await this.utility.containsDefaultExport(filePath);
      if (containsDefaultExport === true) {
        result.statement = `export { default as ${baseName} } from './${importRelativePath}';`;
      } else {
        result.statement = `export * from './${importRelativePath}';`;
      }
    }

    return result;
  }
}
