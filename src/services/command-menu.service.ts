import { inject, injectable } from 'inversify';
import { BotService } from './bot.service';
import { BotCommand } from 'telegraf/types';

@injectable()
export class CommandMenuService {
  private commands: BotCommand[] = [
    { command: 'start', description: 'Начать взаимодествие с ботом' },
    { command: 'get', description: 'Получить рандомный мем' },
    { command: 'menu', description: 'Открыть меню' },
    { command: 'add', description: 'Добавить мем' },
    { command: 'assign', description: 'Назначить пользователя админом' },
    { command: 'help', description: 'Помощь' },
  ] as const;

  constructor(@inject(BotService) private botSrv: BotService) {}

  drawMenu(): void {
    this.botSrv.bot.telegram.setMyCommands(this.commands);
  }
}
