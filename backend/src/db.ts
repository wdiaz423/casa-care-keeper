import 'reflect-metadata';
import { DataSource } from 'typeorm';
// IMPORTACIÓN DE ENTIDADES: Aquí debes listar todas las tablas de DB
import { User } from './entities/User';
import { Home } from './entities/Home';
import { Task } from './entities/Task';
import { CompletionHistory } from './entities/CompletionHistory'
import { HomeMember } from './entities/HomeMember'; 
import { HomeInvitation } from './entities/HomeInvitation'; 

import dotenv from 'dotenv';
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql', 
  host: process.env.DB_HOST || 'localhost', 
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'sakan',
  
  
  entities: [User, Home, Task, HomeMember, HomeInvitation, CompletionHistory],
  
  // cuidado aquí
  // Si es 'true', TypeORM modificará tus tablas automáticamente para que coincidan con tus entidades.
  // Es útil en desarrollo, pero peligroso en producción porque puede borrar datos.
  synchronize: false, 
  
  logging: false, 
});

