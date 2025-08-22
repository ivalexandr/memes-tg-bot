import { Context } from 'telegraf';

export const makeContextKey = (ctx: Context): string | null => {
  const chatId = ctx.chat?.id;
  if (!chatId) return null;
  return `${chatId}`;
};
