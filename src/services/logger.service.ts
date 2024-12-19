import signale from 'signale';
import { LoggerInterface } from '../interfaces/logger.interface';
import { injectable } from 'inversify';

@injectable()
export class LoggerService implements LoggerInterface {
  private logger = signale;

  info(message: string): void {
    this.logger.info(message);
  }

  error(message: string): void {
    this.logger.error(message);
  }

  warning(message: string): void {
    this.logger.warn(message);
  }
}
