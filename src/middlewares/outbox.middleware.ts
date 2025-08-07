import { Context, MiddlewareFn } from 'telegraf';
import { BotMessageRepository } from '../database/repositories/bot-message.repository';
import { LoggerInterface } from '../interfaces/logger.interface';
import { Update } from 'telegraf/types';

export const outboxMiddleware = (
  repo: BotMessageRepository,
  logger: LoggerInterface
): MiddlewareFn<Context<Update>> => {
  return async (ctx, next) => {
    const wrap = <T extends (...a: any[]) => Promise<any>>(
      fn?: T
    ): T | undefined => {
      if (!fn) return fn;
      return (async (...args: any[]) => {
        const res = await fn.apply(ctx, args);
        try {
          if (res?.message_id && (res?.chat?.id ?? ctx.chat?.id)) {
            await repo.record(res.chat?.id ?? ctx.chat?.id, res.message_id);
            logger.info('Сообщение от бота записано в БД');
          }
        } catch {}
        return res;
      }) as T;
    };

    ctx.reply = wrap(ctx.reply)!;
    ctx.replyWithPhoto = wrap(ctx.replyWithPhoto)!;
    ctx.replyWithDocument = wrap(ctx.replyWithDocument)!;
    ctx.replyWithVideo = wrap(ctx.replyWithVideo)!;
    ctx.replyWithAnimation = wrap(ctx.replyWithAnimation)!;
    ctx.replyWithAudio = wrap(ctx.replyWithAudio)!;
    ctx.replyWithMediaGroup = wrap(ctx.replyWithMediaGroup)!;

    return await next();
  };
};
