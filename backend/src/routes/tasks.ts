import { Router } from 'express';
import { AppDataSource } from '../db';
import { Task } from '../entities/Task';
import { Home } from '../entities/Home';
import { CompletionHistory } from '../entities/CompletionHistory';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../entities/User';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/', requireAuth, async (req: any, res: any) => {
  const { title, description, homeId } = req.body;
  if (!title || !homeId) return res.status(400).json({ error: 'title and homeId required' });
  try {
    const home = await AppDataSource.getRepository(Home).findOne({ where: { id: homeId } });
    if (!home) return res.status(404).json({ error: 'home not found' });
    const repo = AppDataSource.getRepository(Task);
    const task = repo.create({ title, description, home });
    await repo.save(task);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: 'could not create task', details: err });
  }
});

router.get('/', async (req, res) => {
  const tasks = await AppDataSource.getRepository(Task).find({ relations: ['home', 'assignedTo'] });
  res.json(tasks);
});



// RUTA PARA ACTUALIZAR O COMPLETAR UNA TAREA

router.put('/:id', requireAuth, async (req: any, res: any) => {
  const { id } = req.params;
  const userId = req.user.id; 

  try {
    const taskRepo = AppDataSource.getRepository(Task);
    const historyRepo = AppDataSource.getRepository(CompletionHistory);

   
    const task = await taskRepo.findOne({ where: { id: Number(id) }, relations: ['home'] });
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

   
    task.lastCompleted = new Date();
    await taskRepo.save(task);

    
    const newHistory = historyRepo.create({
      task: task,
      user: { id: userId } as any,
      completedAt: new Date(),
      notes: req.body.notes || 'Tarea completada'
    });
    
    await historyRepo.save(newHistory);

    res.json({ message: 'Tarea completada y estadísticas actualizadas', task, history: newHistory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la tarea' });
  }
});


// RUTA PARA ELIMINAR UNA TAREA
router.delete('/:id', requireAuth, async (req: any, res: any) => {
  try {
    const repo = AppDataSource.getRepository(Task);
    const result = await repo.delete(req.params.id);
    
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Tarea no encontrada' });
    }
    
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar la tarea' });
  }
});

export default router;
