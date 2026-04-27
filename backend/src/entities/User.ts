import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Home } from './Home';
import { HomeMember } from './HomeMember';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true }) 
  passwordHash?: string;      

  @Column({ nullable: true }) 
  name?: string;

 @Column({ name: 'avatar_url', nullable: true, type: 'text' })
 avatarUrl!: string; 

  @OneToMany(() => Home, (home) => home.owner)
  homes!: Home[];

  @OneToMany(() => HomeMember, (member) => member.user)
  memberships!: HomeMember[];  

  @Column({ name: 'reset_password_token', nullable: true, type: 'varchar' })
  resetPasswordToken?: string;

  @Column({ name: 'reset_password_expires', nullable: true, type: 'datetime' })
  resetPasswordExpires?: Date;
 
}
