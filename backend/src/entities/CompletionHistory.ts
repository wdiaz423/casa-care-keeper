import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn,
  JoinColumn 
} from 'typeorm';
import { User } from './User';
import { Task } from './Task'; 

@Entity('completion_history')
export class CompletionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn({ name: 'completed_at' }) 
  completedAt: Date;

  // Quién completó la tarea
  @ManyToOne(() => User, (user) => user.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' }) 
  user: User;

  // Qué tarea se completó
  @ManyToOne(() => Task, (task) => task.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Task;
}