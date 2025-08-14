// src/services/background-cleanup-cron.service.ts
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ActionInterface } from '../interfaces/action.interface';
import { BotMessageRepository } from '../database/repositories/bot-message.repository';
import { LoggerInterface } from '../interfaces/logger.interface';
import cron, { ScheduledTask } from 'node-cron';
import { ConversationRepository } from '../database/repositories/conversation.repository';

@injectable()
export class BackgroundCleanupCronService implements ActionInterface {
  private task?: ScheduledTask;

  private readonly retainDays = Number(process.env.CLEANUP_RETAIN_DAYS ?? 30);
  private readonly cronExpr = process.env.CLEANUP_CRON ?? '0 3 * * *';

  constructor(
    @inject(TYPES.BotMessageRepository)
    private botMsgRepo: BotMessageRepository,
    @inject(TYPES.LoggerService) private loggerSrv: LoggerInterface,
    @inject(TYPES.ConversationRepository)
    private convSrv: ConversationRepository
  ) {}

  register(): void {
    this.task = cron.schedule(
      this.cronExpr,
      async () => {
        try {
          const before = Date.now();
          await this.botMsgRepo.purgeOlderThan(this.retainDays);
          await this.convSrv.purgeOlderThan(this.retainDays);

          const took = Date.now() - before;
          this.loggerSrv.info(
            `Cleanup cron done (older than ${this.retainDays}d). Took ${took}ms`
          );
        } catch (e) {
          this.loggerSrv.error(
            `Cleanup cron failed: ${e instanceof Error ? e.message : String(e)}`
          );
        }
      },
      {
        timezone: process.env.TZ || 'Europe/Berlin',
      }
    );

    this.task.start();
    this.loggerSrv.info(
      `BackgroundCleanupCronService scheduled: "${this.cronExpr}"`
    );

    process.once('SIGINT', () => this.stop());
    process.once('SIGTERM', () => this.stop());
  }

  private stop(): void {
    this.task?.stop();
    this.loggerSrv.info('BackgroundCleanupCronService stopped');
  }
}
