import { createContainer, asClass, InjectionMode} from 'awilix';

import { VsCodeApi } from './vs-code-api';
import { Configuration } from './configuration';
import { Utility } from './utility';
import { BarrelBuilder } from './barrel-builder';
import { CreateBarrelCommand } from './create-barrel-command';

export const container = createContainer({
    injectionMode: InjectionMode.CLASSIC
});

container.register({vsCodeApi: asClass(VsCodeApi).singleton()});
container.register({configuration: asClass(Configuration).singleton()});
container.register({utility: asClass(Utility).singleton()});
container.register({barrelBuilder: asClass(BarrelBuilder).singleton()});
container.register({createBarrelCommand: asClass(CreateBarrelCommand)});