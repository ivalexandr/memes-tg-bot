import { inject, injectable } from 'inversify';
import { UserRepository } from '../database/repositories/user.repository';
import { LoggerService } from '../services/logger.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { BotService } from '../services/bot.service';
import { Role } from '../database/enums/role.enum';

@injectable()
export class AssignAction {
  constructor(
    @inject(UserRepository) private userRepo: UserRepository,
    @inject(LoggerService) private loggerSrv: LoggerInterface,
    @inject(BotService) private botSrv: BotService
  ) {}

  assign(): void {
    this.botSrv.bot.command('assign', async (ctx) => {
      const userId = ctx.from.id;
      try {
        if (!(await this.userRepo.isUserExists(userId))) {
          await ctx.reply(
            'Ты не зарегистрирован, зарегистрироваться нужно с помощью комманды \/start'
          );
          return;
        }

        if (!(await this.userRepo.isUserAdmin(userId))) {
          await ctx.reply(
            'Ты не являешься админом, поэтому не можешь назначить других пользователей админами'
          );
          return;
        }

        const commandArguments = ctx.message.text.split(' ');

        if (commandArguments.length > 2 || commandArguments.length === 1) {
          await ctx.reply(
            'Необходимо ввести комманду вместе с тегом пользователя в формате \/assign username'
          );
          return;
        }

        const userToAssign = commandArguments[1];

        const user = await this.userRepo.getUserByTag(userToAssign);

        if (!user) {
          await ctx.reply(
            `Пользователь ${userToAssign} не зарегистрирован в боте`
          );
          return;
        }

        user.role = Role.Admin;

        await this.userRepo.update(user);

        this.loggerSrv.info(
          `Пользователь ${user.tgId} был назначен админом и теперь может доабвлять свои мемы`
        );
        await ctx.reply(`Пользователь ${user.tag} был назначен админом`);
      } catch (error) {
        if (typeof error === 'string') {
          this.loggerSrv.error(error);
        }

        await ctx.reply(
          'Произошла ошибка назначения пользователя админом, попробуй позже'
        );
      }
    });
  }
}
