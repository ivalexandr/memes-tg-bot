import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { Telegraf } from 'telegraf';
import { LoggerInterface } from '../interfaces/logger.interface';
import { UserRepository } from '../database/repositories/user.repository';
import { Role } from '../database/enums/role.enum';
import { ActionInterface } from '../interfaces/action.interface';
import { TYPES } from '../types';

@injectable()
export class StartAction implements ActionInterface {
  private bot: Telegraf;

  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface,
    @inject(TYPES.UserRepository) private userRepo: UserRepository
  ) {
    this.bot = this.botSrv.bot;
  }

  register(): void {
    this.bot.start(async (ctx, next) => {
      try {
        const username = ctx.from.first_name || 'Пользователь';
        const userId = ctx.from.id;
        const strUser = String(userId);

        const isExists = await this.userRepo.isUserExists(strUser);
        const tag = ctx.from.username!;

        if (isExists) {
          await ctx.reply(
            `Привет, ${username}! 👋 Добро пожаловать в бот мемасов`
          );
          return await next();
        }

        const role = strUser === process.env.OWNER_ID ? Role.Owner : Role.User;

        await this.userRepo.create({
          tgId: strUser,
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
        return await next();
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        }
        await ctx.reply(
          'Произошла ошибка при регистрации в боте, попробуй еще раз'
        );
        return await next();
      }
    });
  }
}
