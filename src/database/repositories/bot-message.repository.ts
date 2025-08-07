import { inject, injectable } from 'inversify';
import { TYPES } from '../../types';
import { DatabaseService } from '../../services/database.service';
import { Repository } from 'typeorm';
import { BotMessage } from '../entities/bot-message.entity';

@injectable()
export class BotMessageRepository {
  private repo: Repository<BotMessage>;
  constructor(
    @inject(TYPES.DatabaseService) private databaseSrv: DatabaseService
  ) {
    this.repo = this.databaseSrv.dataSource.getRepository(BotMessage);
  }

  async record(chatID: number | string, messageID: number): Promise<void> {
    const entity = this.repo.create({
      chatId: String(chatID),
      messageId: messageID,
    });
    await this.repo.insert(entity);
  }

  async exists(chatID: number | string, messageID: number): Promise<boolean> {
    const count = await this.repo.count({
      where: { chatId: String(chatID), messageId: messageID },
    });
    return count > 0;
  }

  async purgeOlderThan(days: number) {
    await this.repo
      .createQueryBuilder()
      .delete()
      .from(BotMessage)
      .where('createdAt < datetime("now", :offset)', {
        offset: `-${days} days`,
      })
      .execute();
  }
}
