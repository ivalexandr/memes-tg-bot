import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { message } from 'telegraf/filters';
import { ActionInterface } from '../interfaces/action.interface';
import { TYPES } from '../types';

@injectable()
export class KeywordAction implements ActionInterface {
  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.LoggerService) private logger: LoggerInterface
  ) {}

  private keywordsMap: Record<string, string> = {
    да: 'пизда',
    нет: 'пидора ответ',
    где: 'в пизде',
    молодцы: 'сосут концы',
    а: 'хуй на',
    триста: 'отсоси у тракториста',
    сво: 'Слава Богу Z ❤️СЛАВА Z ❤️АНГЕЛА ХРАНИТЕЛЯ Z КАЖДОМУ ИЗ ВАС ❤️БОЖЕ ХРАНИ Z ❤️СПАСИБО ВАМ НАШИ СВО ❤️ ХРАНИ ZOV✊ СПАСИБО НАШИМ БОЙЦАМ',
    svo: 'Слава Богу Z ❤️СЛАВА Z ❤️АНГЕЛА ХРАНИТЕЛЯ Z КАЖДОМУ ИЗ ВАС ❤️БОЖЕ ХРАНИ Z ❤️СПАСИБО ВАМ НАШИ СВО ❤️ ХРАНИ ZOV✊ СПАСИБО НАШИМ БОЙЦАМ',
  };

  register(): void {
    this.botSrv.bot.on(message('text'), async (ctx, next) => {
      const text = ctx.message.text.toLowerCase();

      if (
        text.startsWith('/') ||
        !Object.keys(this.keywordsMap).includes(text)
      ) {
        return await next();
      }

      try {
        for (const keyword in this.keywordsMap) {
          if (['svo', 'сво'].includes(text)) {
            const response = this.keywordsMap[keyword];
            await ctx.reply(response, {
              reply_parameters: {
                message_id: ctx.message.message_id,
              },
            });
            this.logger.info(`Слово "${keyword}" вызвало автоответ.`);
            break;
          }

          if (text.trim() === keyword) {
            const response = this.keywordsMap[keyword];
            await ctx.reply(response, {
              reply_parameters: { message_id: ctx.message.message_id },
            });
            this.logger.info(`Слово "${keyword}" вызвало автоответ.`);
            break;
          }
        }
      } catch (error) {
        if (typeof error === 'string') {
          this.logger.error(error);
        } else if (error instanceof Error) {
          this.logger.error(error.message);
        }
      }
    });
  }
}
