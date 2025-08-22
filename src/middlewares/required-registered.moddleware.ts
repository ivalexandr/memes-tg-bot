import { Context, MiddlewareFn } from 'telegraf';
import { UserRepository } from '../database/repositories/user.repository';
import { RegistrationCacheService } from '../services/registration-cache.service';
import { Ctx } from '../services/bot.service';

export const requiredRegisteredMiddleware =
  (
    repo: UserRepository,
    cache: RegistrationCacheService,
    opts?: { hard?: boolean; botUsername?: string }
  ): MiddlewareFn<Ctx> =>
  async (ctx, next) => {
    const raw =
      (ctx.message && 'text' in ctx.message && ctx.message.text) ||
      (ctx.channelPost && 'text' in ctx.channelPost && ctx.channelPost.text) ||
      '';
    const normalized = raw.trim();

    const isCmd = typeof normalized === 'string' && normalized.startsWith('/');
    const cmd = isCmd ? normalized.split(/\s+/)[0].toLowerCase() : '';
    if (cmd === '/start' || cmd.startsWith('/help')) return await next();

    const userId = ctx.from?.id ? String(ctx.from.id) : null;
    if (!userId) return await next();

    const cached = cache.get(userId);
    if (cached !== undefined) {
      (ctx.userState ??= { userRegistered: null }).userRegistered = cached;
      if (!cached && opts?.hard) {
        await replyStartHint(ctx, opts?.botUsername);
        return;
      }
      return await next();
    }

    const ok = await repo.isUserExists(userId);
    cache.set(userId, ok);
    (ctx.userState ??= { userRegistered: null }).userRegistered = ok;

    if (!ok && opts?.hard) {
      await replyStartHint(ctx, opts?.botUsername);
      return;
    }

    return await next();
  };

const replyStartHint = async (ctx: Context, botUsername?: string) => {
  const hint = botUsername
    ? `Откройте чат с @${botUsername} и нажмите /start, затем повторите попытку.`
    : `Откройте бота в личке и нажмите /start, затем повторите попытку.`;
  await ctx.reply(
    `Чтобы пользоваться ботом, нужно один раз нажать /start в личных сообщениях.\n${hint}`
  );
};
