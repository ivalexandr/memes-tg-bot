import 'reflect-metadata';
import { DatabaseService } from './database/services/database.service';
import { BotService } from './services/bot.service';
import { Container } from 'inversify';
import { StartAction } from './actions/start.action';
import { CommandMenuService } from './services/command-menu.service';
import { HelpAction } from './actions/help.action';
import { glob } from 'glob';
import { AddAction } from './actions/add.action';
import { GetAction } from './actions/get.actions';
import { AssignAction } from './actions/assign.action';
import path from 'path';

const registerServices = async (
  container: Container,
  directory: string
): Promise<void> => {
  const files = await glob(path.join(directory, '**/*.{ts,js}'), {
    absolute: true,
  });

  for (const file of files) {
    const module = require(file);
    for (const key in module) {
      if (Object.prototype.hasOwnProperty.call(module, key)) {
        const exportedClass = module[key];
        if (Reflect.getMetadata('inversify:paramtypes', exportedClass)) {
          container.bind(exportedClass).to(exportedClass).inSingletonScope();
        }
      }
    }
  }
};

const bootstrap = async (): Promise<void> => {
  const container = new Container();

  container.bind(DatabaseService).to(DatabaseService).inSingletonScope();

  await registerServices(container, path.join(__dirname, './services'));
  await registerServices(
    container,
    path.join(__dirname, './database/repositories')
  );
  await registerServices(container, path.join(__dirname, './actions'));

  const database = container.get(DatabaseService);
  const bot = container.get(BotService);
  await database.initialize();

  container.get(CommandMenuService).drawMenu();
  container.get(StartAction).start();
  container.get(HelpAction).openHelp();
  container.get(GetAction).getMemes();
  container.get(AssignAction).assign();

  const addAction = container.get(AddAction);
  addAction.add();
  addAction.photo();

  await bot.initialize();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

bootstrap();
