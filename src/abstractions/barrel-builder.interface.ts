import { BarrelDetails } from '../models/barrel-details';

export interface IBarrelBuilder {
    build(rootFolderPath: string, filePaths: Array<string>):  Promise<BarrelDetails>;
}