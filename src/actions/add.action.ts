import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { MemesRepository } from '../database/repositories/memes.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { message } from 'telegraf/filters';
import { ActionInterface } from '../interfaces/action.interface';
import { mkdir, writeFile } from 'fs/promises';
import { TYPES } from '../types';
import axios from 'axios';
import sharp from 'sharp';
import path from 'path';

@injectable()
export class AddAction implements ActionInterface {
  private userStates = new Set<number>();

  constructor(
    @inject(TYPES.BotService) private botSrv: BotService,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface,
    @inject(TYPES.MemesRepository) private memesRepo: MemesRepository,
    @inject(TYPES.UserRepository) private userRepo: UserRepository
  ) {}

  register(): void {
    this.add();
    this.photo();
  }

  private add(): void {
    this.botSrv.bot.command('add', async (ctx, next) => {
      const userId = ctx.from.id;

      const userStr = String(userId);

      if (!(await this.userRepo.isUserExists(userStr))) {
        await ctx.reply(
          'Ты не зарегистрирован, для регистрации необходимо отправить команду \/start'
        );
        return await next();
      }

      if (await this.userRepo.isUserAdmin(userStr)) {
        this.userStates.add(userId);
        await ctx.reply('Пожалуйста, отправь мне картинку, и я её сохраню');
        return await next();
      }

      this.loggerSrv.warning(
        `Пользователь ${userId} пытался добавить картинку, но он не является админом`
      );
      await ctx.reply('Чтобы добавлять новые мемы вы должны быть админом');
      return await next();
    });
  }

  private photo(): void {
    this.botSrv.bot.on(message('photo'), async (ctx, next) => {
      const userId = ctx.from.id;

      if (this.userStates.has(userId)) {
        try {
          const photos = ctx.message.photo;
          const hightestQualityPhotos = photos[photos.length - 1];
          const fileId = hightestQualityPhotos.file_id;
          const file = await ctx.telegram.getFile(fileId);
          const filePath = file.file_path;

          if (!filePath) {
            await ctx.reply('Не удалось получить файл, попробуй снова');
            return await next();
          }

          const createdMemesId = await this.memesRepo.createAndReturnId();
          const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${filePath}`;
          const imagesDir = path.join(__dirname, '../memes');
          const convertedFilePath = path.join(
            imagesDir,
            `${createdMemesId}.webp`
          );
          await mkdir(imagesDir, { recursive: true });
          const response = await axios({
            url,
            method: 'GET',
            responseType: 'arraybuffer',
          });

          const bufferFile = Buffer.from(response.data);
          const convertedWebp = await sharp(bufferFile)
            .webp({ quality: 80 })
            .toBuffer();

          await writeFile(convertedFilePath, convertedWebp);
          this.loggerSrv.info(
            `Пользователь ${userId} успешно загрузил новый мем`
          );
          await ctx.reply('Твой мем был удачно загружен!');
          this.userStates.delete(userId);
          return await next();
        } catch (error) {
          if (typeof error === 'string') {
            this.loggerSrv.error(error);
          } else if (error instanceof Error) {
            this.loggerSrv.error(error.message);
          }

          await ctx.reply('Произошла ошибка загрузки файла, попробуй снова');
          return await next();
        }
      }
    });
  }
}
