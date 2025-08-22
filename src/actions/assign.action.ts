import { inject, injectable } from 'inversify';
import { UserRepository } from '../database/repositories/user.repository';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import { Role } from '../database/enums/role.enum';
import { ActionInterface } from '../interfaces/action.interface';
import { TYPES } from '../types';

@injectable()
export class AssignAction implements ActionInterface {
  constructor(
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface,
    @inject(TYPES.BotService) private botSrv: BotService
  ) {}

  register(): void {
    this.botSrv.bot.command('assign', async (ctx, next) => {
      const userId = ctx.from.id;
      try {
        if (!(await this.userRepo.isUserExists(userId))) {
          await ctx.reply(
            'Ты не зарегистрирован, зарегистрироваться нужно с помощью комманды \/start'
          );
          return await next();
        }

        if (!(await this.userRepo.isUserAdmin(userId))) {
          await ctx.reply(
            'Ты не являешься админом, поэтому не можешь назначить других пользователей админами'
          );
          return await next();
        }

        const commandArguments = ctx.message.text.split(' ');

        if (commandArguments.length > 2 || commandArguments.length === 1) {
          await ctx.reply(
            'Необходимо ввести комманду вместе с тегом пользователя в формате \/assign username'
          );
          return await next();
        }

        const userToAssign = commandArguments[1];

        const user = await this.userRepo.getUserByTag(userToAssign);

        if (!user) {
          await ctx.reply(
            `Пользователь ${userToAssign} не зарегистрирован в боте`
          );
          return await next();
        }

        user.role = Role.Admin;

        await this.userRepo.update(user);

        this.loggerSrv.info(
          `Пользователь ${user.tgId} был назначен админом и теперь может доабвлять свои мемы`
        );
        await ctx.reply(`Пользователь ${user.tag} был назначен админом`);
        return await next();
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        } else if (error instanceof Error) {
          this.loggerSrv.error(error.message);
        }

        await ctx.reply(
          'Произошла ошибка назначения пользователя админом, попробуй позже'
        );
        return await next();
      }
    });
  }
}
