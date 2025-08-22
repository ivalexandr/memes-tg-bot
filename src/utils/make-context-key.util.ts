import { Context } from 'telegraf';

export const makeContextKey = (ctx: Context): string | null => {
  const chatId = ctx.chat?.id;
  if (!chatId) return null;
  const threadId = (ctx as any).message?.message_thread_id ?? 0;
  return `${chatId}::${threadId}`;
};
