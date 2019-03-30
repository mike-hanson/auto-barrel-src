import * as path from 'path';

import { IBarrelBuilder } from './abstractions/barrel-builder.interface';
import { Configuration } from './configuration';
import { Utility } from './utility';
import { BarrelDetails } from './models/barrel-details';

export class BarrelBuilder implements IBarrelBuilder {

    constructor(private configuration: Configuration,
        private utility: Utility) {
    }

    public async build(rootFolderPath: string, filePaths: Array<string>): Promise<BarrelDetails> {
        const config = this.configuration.current;
        const languageExtension = this.utility.getLanguageExtension(filePaths);
        const aliases: Array<string> = [];
        const result = new Array<string>();

        for (let i = 0; i < filePaths.length; i++) {
            const filePath = filePaths[i];

            if (!this.utility.shouldBeIncludedInBarrel(filePath, languageExtension)) {
                continue;
            }

            const fileExtension = path.extname(filePath);
            const fileName = path.basename(filePath, fileExtension);
            const fileRelativePath = path.relative(rootFolderPath, filePath).replace(/\\/g, '/').replace(fileExtension, '');
            if (config.useImportAliasExportPattern) {
                const alias = this.utility.buildAlias(filePath);
                aliases.push(alias);
                result.push(`import * as ${alias} from './${fileRelativePath}';`);
            } else {
                const containsDefaultExport = await this.utility.containsDefaultExport(filePath);
                if (containsDefaultExport === true) {
                    result.push(`export { default as ${fileName} } from './${fileRelativePath}';`)
                } else {
                    result.push(`export * from './${fileRelativePath}';`);
                }
            }
        }

        if (config.useImportAliasExportPattern) {
            result.push(`export { ${aliases.join(', ')} };`);
        }

        return {
            barrelFilePath: `${rootFolderPath}/index.${languageExtension}`,
            contentLines: result
        };
    }
}