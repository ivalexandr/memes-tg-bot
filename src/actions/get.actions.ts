import { inject, injectable } from 'inversify';
import { MemesRepository } from '../database/repositories/memes.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { LoggerService } from '../services/logger.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import path from 'path';

@injectable()
export class GetAction {
  constructor(
    @inject(MemesRepository) private memesRepo: MemesRepository,
    @inject(UserRepository) private userRepo: UserRepository,
    @inject(LoggerService) private loggerSrv: LoggerInterface,
    @inject(BotService) private botSrv: BotService
  ) {}

  getMemes(): void {
    this.botSrv.bot.command('get', async (ctx) => {
      try {
        const userId = ctx.from.id;

        if (!(await this.userRepo.isUserExists(userId))) {
          await ctx.reply(
            'Для того, чтобы получить мем, сперва зарегистрируйся в боте с помощью команды \/start'
          );
          return;
        }

        const randomMemes = await this.memesRepo.getRandomMemes();
        if (!randomMemes) {
          await ctx.reply('На данный момент мемов нет, попробуй позже');
          return;
        }

        ctx.replyWithPhoto({
          source: path.join(__dirname, `../memes/${randomMemes.id}.webp`),
        });
        this.loggerSrv.info(`Пользователь ${userId} получил свой мемес`);
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        }
        await ctx.reply(
          'Произошла ошибка при получении мема, попробуй еще раз'
        );
      }
    });
  }
}
