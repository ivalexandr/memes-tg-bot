import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { LoggerService } from '../services/logger.service';
import { ActionInterface } from '../interfaces/action.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import iconv from 'iconv-lite';
import axios from 'axios';

@injectable()
export class JokeAction implements ActionInterface {
  constructor(
    @inject(BotService) private botSrv: BotService,
    @inject(LoggerService) private loggerSrv: LoggerInterface
  ) {}

  register(): void {
    this.botSrv.bot.command('joke', async (ctx) => {
      try {
        const resJoke = await axios.get(
          'http://rzhunemogu.ru/RandJSON.aspx?CType=1',
          { responseType: 'arraybuffer' }
        );

        const decodedText = iconv
          .decode(resJoke.data, 'win1251')
          .replace(/[\u2028\u2029]/g, '\n')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .replace(/\x00/g, '')
          .replace(/[\x01-\x1F\x7F]/g, '');

        const json = JSON.parse(`${decodedText}`) as { content: string };

        await ctx.reply(json.content, {
          reply_parameters: { message_id: ctx.message.message_id },
        });
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        } else if (error instanceof Error) {
          this.loggerSrv.error(error.message);
        }
        await ctx.reply('Произошла ошибка получения анекдота');
      }
    });
  }
}
