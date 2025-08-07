import { injectable, inject } from 'inversify';
import { message } from 'telegraf/filters';
import { BotService } from '../services/bot.service';
import { ReactionType } from 'telegraf/types';
import { ActionInterface } from '../interfaces/action.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import { TYPES } from '../types';

@injectable()
export class RandomReactionsAction implements ActionInterface {
  private readonly probability = 0.1;
  private readonly emojiPool: ReactionType[] = [
    { emoji: '👍', type: 'emoji' },
    { emoji: '🔥', type: 'emoji' },
    { emoji: '😁', type: 'emoji' },
    { emoji: '😎', type: 'emoji' },
    { emoji: '❤‍🔥', type: 'emoji' },
    { emoji: '💩', type: 'emoji' },
    { emoji: '⚡', type: 'emoji' },
    { emoji: '👀', type: 'emoji' },
  ];

  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface
  ) {}

  public register(): void {
    this.botSrv.bot.on(message('text'), async (ctx, next) => {
      if (ctx.message.text.startsWith('/')) return await next();

      if (Math.random() > this.probability) return await next();

      const randomEmoji =
        this.emojiPool[Math.floor(Math.random() * this.emojiPool.length)];

      try {
        await ctx.telegram.setMessageReaction(
          ctx.chat.id,
          ctx.message.message_id,
          [randomEmoji],
          false
        );

        this.loggerSrv.info(
          `🎯 Поставлена реакция ${randomEmoji} на сообщение: ${ctx.message.text}`
        );
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        } else if (error instanceof Error) {
          this.loggerSrv.error(error.message);
        }
      }
    });
  }
}
