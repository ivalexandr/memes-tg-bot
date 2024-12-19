import { DatabaseService } from '../services/database.service';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { inject, injectable } from 'inversify';
import { Role } from '../enums/role.enum';

@injectable()
export class UserRepository {
  private repo: Repository<User>;

  constructor(@inject(DatabaseService) private databaseSrv: DatabaseService) {
    this.repo = this.databaseSrv.dataSource.getRepository(User);
  }

  async create(user: Omit<User, 'id'>): Promise<void> {
    const newUser = this.repo.create(user);
    await this.repo.save(newUser);
  }

  async update(user: Omit<User, 'id'>): Promise<void> {
    await this.repo.update({ tgId: user.tgId }, user);
  }

  async getUserByTag(tag: string): Promise<User | null> {
    return await this.repo.findOneBy({ tag });
  }

  async isUserExists(userId: number): Promise<boolean> {
    return await this.repo.existsBy({ tgId: userId });
  }

  async isUserAdmin(userId: number): Promise<boolean> {
    const user = await this.repo.findOneBy({ tgId: userId });
    return user!.role >= Role.Admin;
  }
}
