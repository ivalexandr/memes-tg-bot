import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../enums/role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('varchar')
  tgId!: string;

  @Column('text')
  nickname!: string;

  @Column('int')
  role!: Role;

  @Column('text')
  @Index({ unique: true })
  tag!: string;
}
