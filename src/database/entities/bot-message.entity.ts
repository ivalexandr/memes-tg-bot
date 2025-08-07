import {
  Entity,
  Unique,
  PrimaryGeneratedColumn,
  Index,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('bot_messages')
@Unique('UQ_chat_msg', ['chatId', 'messageId'])
export class BotMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar' })
  chatId!: string;

  @Index()
  @Column({ type: 'integer' })
  messageId!: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt!: Date;
}
