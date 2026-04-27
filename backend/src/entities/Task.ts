import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Home } from './Home';
import { User } from './User';

export type TaskStatus = 'open' | 'in_progress' | 'done';

// backend/src/entities/Task.ts

@Entity('task')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Home, (home) => home.id)
  @JoinColumn({ name: 'homeId' }) 
  home!: Home;

  
  @Column({ default: 'open' })
  status!: string;


  @Column({ name: 'homeId' }) 
  homeId!: number;

  @Column({ default: 'General', nullable: true })
  category!: string;

  @Column({ name: 'frequency_value', default: 1 }) 
  frequencyValue!: number;

  @Column({ name: 'frequency_unit', default: 'months' })
  frequencyUnit!: string;

  @Column({ name: 'last_completed', type: 'datetime', nullable: true }) 
  lastCompleted?: Date;

  @Column({ name: 'startDate', type: 'datetime', nullable: true }) 
  startDate?: Date;

 
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' }) 
  assignedTo?: User;
}

