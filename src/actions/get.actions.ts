import { inject, injectable } from 'inversify';
import { MemesRepository } from '../database/repositories/memes.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import { ActionInterface } from '../interfaces/action.interface';
import { TYPES } from '../types';
import path from 'path';

@injectable()
export class GetAction implements ActionInterface {
  constructor(
    @inject(TYPES.MemesRepository) private memesRepo: MemesRepository,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface,
    @inject(TYPES.BotService) private botSrv: BotService
  ) {}

  register(): void {
    this.botSrv.bot.command('get', async (ctx, next) => {
      try {
        const userId = ctx.from.id;

        if (!(await this.userRepo.isUserExists(userId))) {
          await ctx.reply(
            'Для того, чтобы получить мем, сперва зарегистрируйся в боте с помощью команды \/start'
          );
          return await next();
        }

        const randomMemes = await this.memesRepo.getRandomMemes();
        if (!randomMemes) {
          await ctx.reply('На данный момент мемов нет, попробуй позже');
          return await next();
        }

        ctx.replyWithPhoto({
          source: path.join(__dirname, `../memes/${randomMemes.id}.webp`),
        });
        this.loggerSrv.info(`Пользователь ${userId} получил свой мемес`);
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        } else if (error instanceof Error) {
          this.loggerSrv.error(error.message);
        }

        await ctx.reply(
          'Произошла ошибка при получении мема, попробуй еще раз'
        );
        return await next();
      }
    });
  }
}
