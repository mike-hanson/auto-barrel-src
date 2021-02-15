import { createContainer, asClass, InjectionMode } from 'awilix';

import { VsCodeApi } from './vs-code-api';
import { Utility } from './utility';
import { BarrelBuilder } from './barrel-builder';
import { CreateBarrelCommand } from './create-barrel-command';
import { AutoBarreller } from './auto-barreller';
import { ExportStatementBuilder } from './export-statement-builder';
import { UpdateBarrelCommand } from './update-barrel-command';

export const container = createContainer({
  injectionMode: InjectionMode.CLASSIC
});

container.register({ vsCodeApi: asClass(VsCodeApi).singleton() });
container.register({ utility: asClass(Utility).singleton() });
container.register({ barrelBuilder: asClass(BarrelBuilder).singleton() });
container.register({ createBarrelCommand: asClass(CreateBarrelCommand) });
container.register({ updateBarrelCommand: asClass(UpdateBarrelCommand) });
container.register({ autoBarreller: asClass(AutoBarreller) });
container.register({ exportStatementBuilder: asClass(ExportStatementBuilder).singleton() });
