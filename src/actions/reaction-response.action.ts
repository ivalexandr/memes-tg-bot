import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { BotService } from '../services/bot.service';
import { ActionInterface } from '../interfaces/action.interface';
import { BotMessageRepository } from '../database/repositories/bot-message.repository';
import { LoggerInterface } from '../interfaces/logger.interface';

@injectable()
export class ReactionResponseAction implements ActionInterface {
  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.BotMessageRepository)
    private botMsgRepo: BotMessageRepository,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface
  ) {}

  register(): void {
    this.botSrv.bot.on('message_reaction', async (ctx, next) => {
      try {
        const upd = ctx.update;
        const mr = upd.message_reaction;

        if (!mr) return await next();

        const chatID = mr.chat?.id;
        const reactedMsgID = mr.message_id;
        const newReaction = mr.new_reaction?.[0];
        const fromUser = mr.user;

        if (!chatID || !reactedMsgID) return await next();

        const isOur = await this.botMsgRepo.exists(chatID, reactedMsgID);

        if (!isOur) return await next();

        if (newReaction?.type === 'emoji') {
          await ctx.reply(
            `Хватит ставить свои реакции (${newReaction.emoji}) на мое сообщение, ${fromUser?.first_name ?? 'друг'}!`,
            { reply_parameters: { message_id: reactedMsgID } }
          );
        }

        await this.botMsgRepo.purgeOlderThan(30);
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        } else if (error instanceof Error) {
          this.loggerSrv.error(error.message);
        }
        await next();
      }
    });
  }
}
