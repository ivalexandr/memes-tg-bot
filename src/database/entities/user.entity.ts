import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('int')
  tgId!: number;

  @Column('text')
  nickname!: string;

  @Column('int')
  @Index({ unique: true })
  role!: Role;

  @Column('text')
  @Index({ unique: true })
  tag!: string;
}
