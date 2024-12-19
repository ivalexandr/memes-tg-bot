import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { LoggerInterface } from '../../interfaces/logger.interface';
import { inject, injectable } from 'inversify';
import { LoggerService } from '../../services/logger.service';
import { Memes } from '../entities/memes.entity';

@injectable()
export class DatabaseService {
  private _datasource: DataSource;

  constructor(@inject(LoggerService) private loggerSrv: LoggerInterface) {
    const logging = process.env.NODE_ENV === 'development';
    this._datasource = new DataSource({
      type: 'sqlite',
      database: `${__dirname}/../memes_bot.sqlite`,
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
