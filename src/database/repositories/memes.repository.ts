import { inject, injectable } from 'inversify';
import { DatabaseService } from '../services/database.service';
import { Repository } from 'typeorm';
import { Memes } from '../entities/memes.entity';

@injectable()
export class MemesRepository {
  private repo: Repository<Memes>;

  constructor(@inject(DatabaseService) private databaseSrv: DatabaseService) {
    this.repo = this.databaseSrv.dataSource.getRepository(Memes);
  }

  async createAndReturnId(): Promise<string> {
    const newMemes = this.repo.create({ createAt: new Date().toISOString() });
    await this.repo.save(newMemes);
    return newMemes.id;
  }

  async getCountOfMemes(): Promise<number> {
    return await this.repo.count();
  }

  async getRandomMemes(): Promise<Memes | null> {
    return await this.repo.createQueryBuilder().orderBy('RANDOM()').getOne();
  }
}
