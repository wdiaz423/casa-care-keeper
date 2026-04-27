import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Home } from './Home';
import { User } from './User';
import { HomeRole } from '../types/roles';



@Entity('home_invitation')
export class HomeInvitation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', nullable: true })
  email?: string; 

  @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  })
  role!: HomeRole;

  @Column({ name: 'invite_code', type: 'varchar' })
  inviteCode!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt!: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Home)
  @JoinColumn({ name: 'homeId' })
  home!: Home; 

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invited_by_id' })
  invitedBy!: User;
}




