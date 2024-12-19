import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';

@injectable()
export class HelpAction {
  constructor(@inject(BotService) private botSrv: BotService) {}

  openHelp(): void {
    this.botSrv.bot.help(async (ctx) => {
      await ctx.reply(
        'В данном боте можно добавлять новые мемы (если вы админ) и получать рандомные мемы по команде \/get'
      );
    });
  }
}
