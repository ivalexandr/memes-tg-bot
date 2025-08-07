import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { LoggerInterface } from '../interfaces/logger.interface';
import { inject, injectable } from 'inversify';
import { Memes } from '../database/entities/memes.entity';
import { TYPES } from '../types';

@injectable()
export class DatabaseService {
  private _datasource: DataSource;

  constructor(@inject(TYPES.LoggerService) private loggerSrv: LoggerInterface) {
    const logging = process.env.NODE_ENV === 'development';
    this._datasource = new DataSource({
      type: 'better-sqlite3',
      database: `${__dirname}/../db/memes_bot.sqlite`,
      synchronize: true,
      logging,
      entities: [User, Memes],
    });
  }

  get dataSource(): DataSource {
    return this._datasource;
  }

  async initialize(): Promise<void> {
    if (!this._datasource.isInitialized) {
      await this._datasource.initialize();
      this.loggerSrv.info('База данных инициализирована...');
    }
  }
}
