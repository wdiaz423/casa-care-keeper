import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { User } from './User';
import { Home } from './Home';
import { HomeRole } from '../types/roles';


@Entity('home_member')
export class HomeMember {
  @PrimaryGeneratedColumn()
  id!: number;

 @Column({
    type: 'enum',
    enum: ['owner', 'admin', 'member'],
    default: 'member'
  })
  role!: HomeRole;

  @CreateDateColumn()
  created_at!: Date;

  // RELACIONES
  
  // Muchos registros de miembros pueden pertenecer a un solo Usuario
   @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  // Muchos registros de miembros pueden pertenecer a una sola Casa
  @ManyToOne(() => Home, (home) => home.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeId' })
  home!: Home;
}
