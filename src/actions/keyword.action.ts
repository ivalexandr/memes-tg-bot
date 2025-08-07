import { inject, injectable } from 'inversify';
import { LoggerService } from '../services/logger.service';
import { BotService } from '../services/bot.service';
import { message } from 'telegraf/filters';

@injectable()
export class KeywordAction {
  constructor(
    @inject(BotService) private botSrv: BotService,
    @inject(LoggerService) private logger: LoggerService
  ) {}

  private keywordsMap: Record<string, string> = {
    да: 'пизда',
    нет: 'пидора ответ',
  };

  sendMessage(): void {
    this.botSrv.bot.on(message('text'), async (ctx) => {
      const text = ctx.message.text.toLowerCase();

      for (const keyword in this.keywordsMap) {
        if (text.trim() === keyword) {
          const response = this.keywordsMap[keyword];
          await ctx.reply(response);
          this.logger.info(`Слово "${keyword}" вызвало автоответ.`);
          break;
        }
      }
    });
  }
}
