import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { TYPES } from '../../types';
import { DatabaseService } from '../../services/database.service';

export type Message = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

@injectable()
export class ConversationRepository {
  private repo: Repository<Conversation>;
  private ttlHours = Number(process.env.CONTEXT_TTL_HOURS ?? 24);
  private maxTurns = Number(process.env.CONTEXT_MAX_TURNS ?? 16);

  constructor(
    @inject(TYPES.DatabaseService) private databaseSrv: DatabaseService
  ) {
    this.repo = this.databaseSrv.dataSource.getRepository(Conversation);
  }

  async getHistory(key: string): Promise<Message[]> {
    const row = await this.repo.findOne({
      where: { chatId: key },
    });
    if (!row) return [];

    const ageHrs = (Date.now() - new Date(row.updatedAt).getTime()) / 36e5;
    if (ageHrs > this.ttlHours) return [];
    try {
      return JSON.parse(row.history) as Message[];
    } catch {
      return [];
    }
  }

  async setHistory(key: string, history: Message[]) {
    const trimmed = history.slice(-this.maxTurns * 2);
    const row = await this.repo.findOne({
      where: { chatId: key },
    });
    if (row) {
      row.history = JSON.stringify(trimmed);
      await this.repo.save(row);
    } else {
      await this.repo.insert({
        chatId: key,
        history: JSON.stringify(trimmed),
      });
    }
  }

  async clear(key: string) {
    await this.repo.delete({ chatId: key });
  }

  async purgeOlderThan(days: number) {
    await this.repo
      .createQueryBuilder()
      .delete()
      .from(Conversation)
      .where('createdAt < datetime("now", :offset)', {
        offset: `-${days} days`,
      })
      .execute();
  }
}
