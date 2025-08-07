import { inject, injectable } from 'inversify';
import { LoggerService } from '../services/logger.service';
import { BotService } from '../services/bot.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { message } from 'telegraf/filters';

@injectable()
export class KeywordAction {
  constructor(
    @inject(BotService) private botSrv: BotService,
    @inject(LoggerService) private logger: LoggerInterface
  ) {}

  private keywordsMap: Record<string, string> = {
    да: 'пизда',
    нет: 'пидора ответ',
    где: 'в пизде',
    молодцы: 'сосут концы',
    а: 'хуй на',
    триста: 'отсоси у тракториста',
  };

  sendMessage(): void {
    this.botSrv.bot.on(message('text'), async (ctx, next) => {
      const text = ctx.message.text.toLowerCase();

      if (text.startsWith('/')) {
        return await next();
      }

      for (const keyword in this.keywordsMap) {
        if (text.trim() === keyword) {
          const response = this.keywordsMap[keyword];
          await ctx.reply(response, {
            reply_parameters: { message_id: ctx.message.message_id },
          });
          this.logger.info(`Слово "${keyword}" вызвало автоответ.`);
          break;
        }
      }
    });
  }
}
