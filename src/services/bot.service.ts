import { Telegraf } from 'telegraf';
import { LoggerService } from './logger.service';
import { inject, injectable } from 'inversify';
import { LoggerInterface } from '../interfaces/logger.interface';

@injectable()
export class BotService {
  private _bot!: Telegraf;

  constructor(@inject(LoggerService) private loggerSrv: LoggerInterface) {
    this.createBot();
  }

  get bot(): Telegraf {
    return this._bot;
  }

  stop(reason?: string): void {
    this._bot.stop(reason);
  }

  async initialize(): Promise<void> {
    await this._bot.launch(() => {
      this.loggerSrv.info('Бот был запущен...');
    });

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
