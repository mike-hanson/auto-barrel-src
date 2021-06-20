import * as path from 'path';

import { StatementDetails } from './models/statement-details';
import { IUtility } from './abstractions/utlity.interface';
import { IExportStatementBuilder } from './abstractions/export-statement-builder.interface';
import { IVsCodeApi } from './abstractions/vs-code-api.interface';

export class ExportStatementBuilder implements IExportStatementBuilder {
  constructor(private utility: IUtility, private vsCodeApi: IVsCodeApi) {}

  public async build(rootFolderPath: string, filePath: string): Promise<StatementDetails> {
    const config = this.vsCodeApi.getConfiguration();
    const result: StatementDetails = {
      statement: undefined,
      alias: undefined,
      isBarrelImport: false
    };

    const fileExtension = path.extname(filePath);
    let baseName = path.basename(filePath, fileExtension);
    let importRelativePath = path
      .relative(rootFolderPath, filePath)
      .replace(/\\/g, '/');    

    if(config.includeExtensionOnExport.indexOf(fileExtension) === -1) {
      importRelativePath = importRelativePath.replace(fileExtension, '');
    }

    if (baseName.toLowerCase() === 'index') {
      importRelativePath = importRelativePath.replace('/index', '');
      baseName = importRelativePath.substr(baseName.lastIndexOf('/') + 1);
      result.isBarrelImport = true;
    }
    
    const lineEnd = config.excludeSemiColonAtEndOfLine? '': ';';
    const quoteCharacter: string = config.quoteStyle === 'Double' ? '"': '\''; 

    if (config.useImportAliasExportPattern) {
      result.alias = this.utility.buildAlias(filePath);
      result.statement = `import * as ${result.alias} from ${quoteCharacter}./${importRelativePath}${quoteCharacter}${lineEnd}`;
    } else {
      const containsDefaultExport = await this.utility.containsDefaultExport(filePath);
      if (containsDefaultExport === true) {
        result.statement = `export { default as ${baseName} } from ${quoteCharacter}./${importRelativePath}${quoteCharacter}${lineEnd}`;
      } else {
        result.statement = `export * from ${quoteCharacter}./${importRelativePath}${quoteCharacter}${lineEnd}`;
      }
    }

    return result;
  }
}
