import { glob } from 'glob';
import { Container, interfaces } from 'inversify';
import path from 'path';
import 'reflect-metadata';
import { outboxMiddleware } from './middlewares/outbox.middleware';
import { requiredRegisteredMiddleware } from './middlewares/required-registered.moddleware';
import { BotService } from './services/bot.service';
import { CommandMenuService } from './services/command-menu.service';
import { DatabaseService } from './services/database.service';
import { TYPES } from './types';
import { checkAction } from './utils/check-action.util';

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
        const exportedClass = module[key] as interfaces.Newable;

        const typeKey = exportedClass.name as keyof typeof TYPES;

        if (
          Object.prototype.hasOwnProperty.call(TYPES, typeKey) &&
          Reflect.getMetadata('inversify:paramtypes', exportedClass)
        ) {
          container.bind(TYPES[typeKey]).to(exportedClass).inSingletonScope();
        }
      }
    }
  }
};

const bootstrap = async (): Promise<void> => {
  const container = new Container();

  await registerServices(container, path.join(__dirname, './services'));
  await registerServices(
    container,
    path.join(__dirname, './database/repositories')
  );
  await registerServices(container, path.join(__dirname, './actions'));

  const database = container.get<DatabaseService>(TYPES.DatabaseService);
  const bot = container.get<BotService>(TYPES.BotService);
  await bot.createBot();
  await database.initialize();

  bot.bot.use(
    requiredRegisteredMiddleware(
      container.get(TYPES.UserRepository),
      container.get(TYPES.RegistrationCacheService)
    ),
    outboxMiddleware(
      container.get(TYPES.BotMessageRepository),
      container.get(TYPES.LoggerService)
    )
  );

  Object.values(TYPES)
    .map((token) => container.get(token))
    .filter((action) => checkAction(action))
    .forEach((action) => {
      action.register();
    });

  container.get<CommandMenuService>(TYPES.CommandMenuService).drawMenu();

  await bot.initialize();

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
};

bootstrap();
