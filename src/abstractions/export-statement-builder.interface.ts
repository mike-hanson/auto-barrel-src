import { StatementDetails } from '../models/statement-details';

export interface IExportStatementBuilder {
    build(rootFolderPath:string, filePath: string): Promise<StatementDetails>;
}