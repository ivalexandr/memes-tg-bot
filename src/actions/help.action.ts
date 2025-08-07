import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { ActionInterface } from '../interfaces/action.interface';
import { TYPES } from '../types';

@injectable()
export class HelpAction implements ActionInterface {
  constructor(@inject(TYPES.BotService) private botSrv: BotService) {}

  register(): void {
    this.botSrv.bot.help(async (ctx) => {
      await ctx.reply(
        'В данном боте можно добавлять новые мемы (если вы админ) и получать рандомные мемы по команде \/get'
      );
    });
  }
}
