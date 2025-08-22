import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'varchar' })
  chatId!: string;

  @Column({ type: 'text' })
  history!: string;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt!: Date;
}
