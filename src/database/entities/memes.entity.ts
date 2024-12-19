import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Memes {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('datetime')
  createAt!: Date;
}
