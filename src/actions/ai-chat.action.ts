import { inject, injectable } from 'inversify';
import { Context } from 'telegraf';
import { message } from 'telegraf/filters';
import type { Message as TelegrafMessage } from 'telegraf/types';
import {
  ConversationRepository,
  Message,
} from '../database/repositories/conversation.repository';
import { ActionInterface } from '../interfaces/action.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import { LlmService } from '../services/llm.service';
import { TYPES } from '../types';
import { chunkArray } from '../utils/chunk-array.util';
import { makeContextKey } from '../utils/make-context-key.util';

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string };

@injectable()
export class AiChatAction implements ActionInterface {
  private botUsername?: string;

  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.ConversationRepository)
    private convRepo: ConversationRepository,
    @inject(TYPES.LlmService) private llm: LlmService,
    @inject(TYPES.LoggerService) private logger: LoggerInterface
  ) {}

  async register(): Promise<void> {
    const me = await this.botSrv.bot.telegram.getMe();
    this.botUsername = me.username;

    this.botSrv.bot.command('ai_reset', async (ctx, next) => {
      const key = makeContextKey(ctx);

      if (!key) return await next();

      await this.convRepo.clear(key);
      await ctx.reply('🧹 Контекст очищен.');
      return await next();
    });

    this.botSrv.bot.command('ai', async (ctx, next) => {
      const text = ctx.message.text.replace(/^\/ai(@\w+)?\s*/i, '').trim();
      if (!text) {
        await ctx.reply('Напиши запрос после команды: /ai Твой вопрос');
        return await next();
      }

      await this.handleQuery(ctx, text);
      return await next();
    });

    this.botSrv.bot.on(message('text'), async (ctx, next) => {
      const chatType = ctx.chat?.type;
      const text = ctx.message.text ?? '';

      if (text.startsWith('/')) return await next();

      if (chatType === 'private') {
        await this.handleQuery(ctx, text);
        return await next();
      }

      const mentioned =
        this.botUsername &&
        new RegExp(`@${this.botUsername}\\b`, 'i').test(text);
      const isReplyToBot = ctx.message.reply_to_message?.from?.is_bot === true;

      if (mentioned || isReplyToBot) {
        const clean = this.botUsername
          ? text.replace(new RegExp(`@${this.botUsername}\\b`, 'ig'), '').trim()
          : text;
        if (clean.length === 0) return await next();
        await this.handleQuery(ctx, clean);
        return await next();
      }

      return await next();
    });
  }

  private async handleQuery(
    ctx: Context,
    userText: string
  ): Promise<TelegrafMessage.TextMessage[] | null> {
    try {
      await ctx.sendChatAction('typing');

      const key = makeContextKey(ctx);

      if (!key) {
        await ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
        return null;
      }

      const history = await this.convRepo.getHistory(key);

      const systemPrompt: ChatMsg = {
        role: 'system',
        content:
          'Ты лаконичный и полезный помощник внутри Telegram. Отвечай по делу, на русском. Не раскрывай ключи и приватные данные.',
      };

      const messages: ChatMsg[] = [
        systemPrompt,
        ...history,
        { role: 'user', content: userText },
      ];

      const answer = await this.llm.chat(messages);

      const newHistory = [
        ...history,
        { role: 'user', content: userText },
        { role: 'assistant', content: answer },
      ] satisfies Message[];

      await this.convRepo.setHistory(key, newHistory);

      const messageId = ctx.message?.message_id;

      if (!messageId) {
        await ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
        return null;
      }

      const chunkedAnswer = chunkArray([...answer], 4096);
      const sends: TelegrafMessage.TextMessage[] = [];

      for (const chunk of chunkedAnswer) {
        const escaped = chunk
          .join('')
          .replace(/([_*[\]()~>#+-=|{}.!])/g, '\\\\$1');
        const sent = await ctx.reply(escaped, {
          reply_parameters: { message_id: messageId },
          parse_mode: 'MarkdownV2',
        });
        sends.push(sent);
      }
      return sends;
    } catch (e) {
      this.logger.error(e instanceof Error ? e.message : String(e));
      await ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
      return null;
    }
  }
}
