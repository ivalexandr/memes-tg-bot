// src/actions/ai-chat.action.ts
import { inject, injectable } from 'inversify';
import { message } from 'telegraf/filters';
import { TYPES } from '../types';
import { ActionInterface } from '../interfaces/action.interface';
import {
  ConversationRepository,
  Message,
} from '../database/repositories/conversation.repository';
import { LlmService } from '../services/llm.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import { Context } from 'telegraf';

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

  public async register() {
    const me = await this.botSrv.bot.telegram.getMe();
    this.botUsername = me.username;

    this.botSrv.bot.command('ai_reset', async (ctx) => {
      await this.convRepo.clear(ctx.from.id);
      await ctx.reply('🧹 Контекст очищен.');
    });

    this.botSrv.bot.command('ai', async (ctx) => {
      const text = ctx.message.text.replace(/^\/ai(@\w+)?\s*/i, '').trim();
      if (!text)
        return ctx.reply('Напиши запрос после команды: /ai Твой вопрос');
      await this.handleQuery(ctx, text);
    });

    this.botSrv.bot.on(message('text'), async (ctx, next) => {
      const chatType = ctx.chat?.type;
      const text = ctx.message.text ?? '';

      if (text.startsWith('/')) return await next();

      if (chatType === 'private') {
        console.log('2324');
        return await this.handleQuery(ctx, text);
      }

      const mentioned =
        this.botUsername &&
        new RegExp(`@${this.botUsername}\\b`, 'i').test(text);
      const isReplyToBot = ctx.message.reply_to_message?.from?.is_bot === true;

      if (mentioned || isReplyToBot) {
        const clean = this.botUsername
          ? text.replace(new RegExp(`@${this.botUsername}\\b`, 'ig'), '').trim()
          : text;
        if (clean.length === 0) return next();
        return await this.handleQuery(ctx, clean);
      }

      return await next();
    });
  }

  private async handleQuery(ctx: Context, userText: string) {
    try {
      await ctx.sendChatAction('typing');

      const userId = ctx.from?.id;

      if (!userId) {
        return ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
      }

      const history = await this.convRepo.getHistory(userId);

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

      await this.convRepo.setHistory(userId, newHistory);

      const messageId = ctx.message?.message_id;

      if (!messageId) {
        return ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
      }

      const sent = await ctx.reply(answer, {
        reply_parameters: { message_id: messageId },
      });

      return sent;
    } catch (e) {
      this.logger.error(e instanceof Error ? e.message : String(e));
      return ctx.reply('Упс, что-то пошло не так. Попробуй ещё раз позже 🙏');
    }
  }
}
