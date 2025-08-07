import { inject, injectable } from 'inversify';
import { BotService } from './bot.service';
import { BotCommand } from 'telegraf/types';
import { TYPES } from '../types';

@injectable()
export class CommandMenuService {
  private commands: BotCommand[] = [
    { command: 'start', description: 'Начать взаимодествие с ботом' },
    { command: 'get', description: 'Получить рандомный мем' },
    { command: 'joke', description: 'Рассказать андекдот' },
    { command: 'menu', description: 'Открыть меню' },
    { command: 'add', description: 'Добавить мем' },
    { command: 'assign', description: 'Назначить пользователя админом' },
    { command: 'help', description: 'Помощь' },
  ] as const;

  constructor(@inject(TYPES.BotService) private botSrv: BotService) {}

  drawMenu(): void {
    this.botSrv.bot.telegram.setMyCommands(this.commands);
  }
}
