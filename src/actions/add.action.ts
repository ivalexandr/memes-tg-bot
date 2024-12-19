import { inject, injectable } from 'inversify';
import { BotService } from '../services/bot.service';
import { LoggerService } from '../services/logger.service';
import { LoggerInterface } from '../interfaces/logger.interface';
import { MemesRepository } from '../database/repositories/memes.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { message } from 'telegraf/filters';
import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import axios from 'axios';
import sharp from 'sharp';

@injectable()
export class AddAction {
  private userStates = new Set<number>();

  constructor(
    @inject(BotService) private botSrv: BotService,
    @inject(LoggerService) private loggerSrv: LoggerInterface,
    @inject(MemesRepository) private memesRepo: MemesRepository,
    @inject(UserRepository) private userRepo: UserRepository
  ) {}

  add(): void {
    this.botSrv.bot.command('add', async (ctx) => {
      const userId = ctx.from.id;

      if (!(await this.userRepo.isUserExists(userId))) {
        await ctx.reply(
          'Ты не зарегистрирован, для регистрации необходимо отправить команду \/start'
        );
        return;
      }

      if (await this.userRepo.isUserAdmin(userId)) {
        this.userStates.add(userId);
        await ctx.reply('Пожалуйста, отправь мне картинку, и я её сохраню');
        return;
      }

      this.loggerSrv.warning(
        `Пользователь ${userId} пытался добавить картинку, но он не является админом`
      );
      ctx.reply('Чтобы добавлять новые мемы вы должны быть админом');
    });
  }

  photo(): void {
    this.botSrv.bot.on(message('photo'), async (ctx) => {
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
            return;
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
        } catch (error) {
          if (typeof error === 'string') {
            this.loggerSrv.error(error);
          }
          await ctx.reply('Произошла ошибка загрузки файла, попробуй снова');
        }
      }
    });
  }
}
