import { inject, injectable } from 'inversify';
import { Context, Telegraf } from 'telegraf';
import { LoggerInterface } from '../interfaces/logger.interface';
import { TYPES } from '../types';

const createProxyAgent = async () => {
  return new (await import('socks-proxy-agent')).SocksProxyAgent(
    'socks5://82.25.185.13:1080'
  );
};

export type Ctx = Context;

@injectable()
export class BotService {
  private _bot!: Telegraf;

  constructor(
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface
  ) {}

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

  async createBot(): Promise<void> {
    try {
      const token = process.env.BOT_TOKEN;

      if (!token || typeof token !== 'string') {
        throw new Error('Не передан токен для бота, запуск бота невозможен');
      }

      const agent = await createProxyAgent();
      console.log(agent, '/////////////////');
      this._bot = new Telegraf<Ctx>(token, { telegram: { agent } });
    } catch (error) {
      if (typeof error === 'string') {
        this.loggerSrv.error(error);
      }
    }
  }
}
