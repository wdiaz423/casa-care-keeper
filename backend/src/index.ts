import express from 'express';
import cors from 'cors';
import { AppDataSource } from './db';
import usersRouter from './routes/users';
import tasksRouter from './routes/tasks';
import homesRouter from './routes/homes';
import invitationRoutes from './routes/invitation';
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:8080', // Permite solo a tu frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


console.log("JWT_SECRET cargado:", process.env.JWT_SECRET);

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/homes', homesRouter);
app.use('/api/invitations', invitationRoutes);

const port = process.env.PORT || 4000;

AppDataSource.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error('DB init error', err);
  });


