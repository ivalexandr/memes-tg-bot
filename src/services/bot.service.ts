import { Telegraf } from 'telegraf';
import { inject, injectable } from 'inversify';
import { LoggerInterface } from '../interfaces/logger.interface';
import { TYPES } from '../types';

@injectable()
export class BotService {
  private _bot!: Telegraf;

  constructor(@inject(TYPES.LoggerService) private loggerSrv: LoggerInterface) {
    this.createBot();
  }

  get bot(): Telegraf {
    return this._bot;
  }

  stop(reason?: string): void {
    this._bot.stop(reason);
  }

  async initialize(): Promise<void> {
    this._bot.launch(
      {
        allowedUpdates: [
          'message',
          'edited_message',
          'callback_query',
          'message_reaction',
          'message_reaction_count',
        ],
      },
      () => {
        this.loggerSrv.info('Бот был запущен...');
      }
    );
    this._bot.catch((err) => {
      this.loggerSrv.error(`Ошибка в работе бота: ${err}`);
    });
  }

  private createBot(): void {
    try {
      const token = process.env.BOT_TOKEN;

      if (!token || typeof token !== 'string') {
        throw new Error('Не передан токен для бота, запуск бота невозможен');
      }

      this._bot = new Telegraf(token);
    } catch (error) {
      if (typeof error === 'string') {
        this.loggerSrv.error(error);
      }
    }
  }
}
