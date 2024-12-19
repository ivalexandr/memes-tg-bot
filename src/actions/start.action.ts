import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { Telegraf } from 'telegraf';
import { LoggerService } from '../services/logger.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { UserRepository } from '../database/repositories/user.repository';
import { Role } from '../database/enums/role.enum';

@injectable()
export class StartAction {
  private bot: Telegraf;

  constructor(
    @inject(BotService) private botSrv: BotService,
    @inject(LoggerService) private loggerSrv: LoggerInterface,
    @inject(UserRepository) private userRepo: UserRepository
  ) {
    this.bot = this.botSrv.bot;
  }

  start(): void {
    this.bot.start(async (ctx) => {
      try {
        const username = ctx.from.first_name || 'Пользователь';
        const userId = ctx.from.id;
        const isExists = await this.userRepo.isUserExists(userId);
        const tag = ctx.from.username!;

        if (isExists) {
          await ctx.reply(
            `Привет, ${username}! 👋 Добро пожаловать в бот мемасов`
          );
          return;
        }

        const role =
          userId === Number(process.env.OWNER_ID) ? Role.Owner : Role.User;

        await this.userRepo.create({
          tgId: userId,
          nickname: username,
          role,
          tag,
        });

        this.loggerSrv.info(
          `Username: ${username} ID: ${userId} добавился в бота`
        );
        await ctx.reply(
          `Привет, ${username}! 👋 Добро пожаловать в бот мемасов`
        );
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        }
        await ctx.reply(
          'Произошла ошибка при регистрации в боте, попробуй еще раз'
        );
      }
    });
  }
}
