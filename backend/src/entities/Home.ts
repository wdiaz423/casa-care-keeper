import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn} from 'typeorm';
import { User } from './User';
import { Task } from './Task';
import { HomeMember } from './HomeMember';

@Entity()
export class Home {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @ManyToOne(() => User, (user) => user.homes)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @OneToMany(() => Task, (task) => task.home)
  tasks!: Task[];

  @OneToMany(() => HomeMember, (member) => member.home)
  members!: HomeMember[]; 
}
