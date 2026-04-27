import { Router } from 'express';
import { AppDataSource } from '../db';
import { Home } from '../entities/Home';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../entities/User';
import { HomeMember } from '../entities/HomeMember';
import { CompletionHistory } from '../entities/CompletionHistory';
import { requireAuth } from '../middleware/auth';


const router = Router();

router.use(requireAuth);

//Obtener todas las casas
router.get('/', async (req, res) => {
  try {
    const homes = await AppDataSource.getRepository(Home).find();
    res.json(homes);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener hogares' });
  }
});


router.post('/', async (req: AuthenticatedRequest, res) => {
  const { name } = req.body;
  
  try {
    const repo = AppDataSource.getRepository(Home);
    
    const home = repo.create({ 
      name, 
      owner: { id: Number(req.user?.id) } as any 
    });
    
    const savedHome = await repo.save(home);
    res.status(201).json(savedHome);
  } catch (err: any) {
   
    console.error("DETALLE DEL ERROR EN MYSQL:", err.sqlMessage || err);
    
    res.status(500).json({ 
      error: 'could not create home', 
      sqlError: err.sqlMessage 
    });
  }
});


//Editar una casa
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const repo = AppDataSource.getRepository(Home);
  try {
    const home = await repo.findOne({ where: { id } });
    if (!home) return res.status(404).json({ error: 'home not found' });
    
    const { name } = req.body;
    home.name = name ?? home.name;
    await repo.save(home);
    res.json(home);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar' });
  }
});

// Eliminar una casa
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  const id = Number(req.params.id);
  const repo = AppDataSource.getRepository(Home);
  try {
    const home = await repo.findOne({ where: { id } });
    if (!home) return res.status(404).json({ error: 'home not found' });
    await repo.remove(home);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar' });
  }
});

//Obtener MIEMBROS con conteo de tareas (La versión avanzada)
router.get('/:id/members', async (req, res) => {
  try {
    const homeId = parseInt(req.params.id);

    const members = await AppDataSource.getRepository(HomeMember)
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user') 
      .leftJoin('completion_history', 'history', 'history.user_id = user.id') 
      .select([
        'member.id',
        'member.role',
        'user.id',
        'user.name',
        'user.email',
      ])
      .addSelect('COUNT(history.id)', 'completedTasksCount') 
      .where('member.homeId = :homeId', { homeId })
      .groupBy('member.id, user.id') 
      .getRawMany(); 

    const formattedMembers = members.map(m => ({
      id: m.member_id,
      userId: m.user_id,
      displayName: m.user_name || 'Usuario',
      role: m.member_role,
      completedTasksCount: parseInt(m.completedTasksCount) || 0
    }));

    res.json(formattedMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener miembros' });
  }
});

//Obtener historial de ACTIVIDAD
router.get('/:homeId/activity', async (req, res) => {
  const { homeId } = req.params;
  try {
    const history = await AppDataSource.getRepository(CompletionHistory)
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.user', 'user')
      .leftJoinAndSelect('history.task', 'task')
      .leftJoin('task.home', 'home') 
      .where('home.id = :homeId', { homeId: Number(homeId) })
      .orderBy('history.completedAt', 'DESC')
      .take(10) // Empecemos con 10 para el dashboard
      .getMany();

    res.json(history);
  } catch (error) {
    console.error("Detalle del error en activity:", error); // Esto te dirá el error real en la terminal
    res.status(500).json({ error: 'Error al obtener actividad' });
  }
});

// ELIMINAR MIEMBRO
router.delete('/:homeId/members/:memberId', async (req: AuthenticatedRequest, res) => {
  try {
    const { homeId, memberId } = req.params;
    const currentUserId = req.user!.id;

    const memberRepo = AppDataSource.getRepository(HomeMember);

    // Verificar si el usuario actual es dueño o admin EN ESTA CASA específicamente
    const requester = await memberRepo.findOne({
      where: { 
        user: { id: currentUserId },
        home: { id: Number(homeId) }
      },
    });

    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar miembros de este hogar' });
    }

    const memberToDelete = await memberRepo.findOne({ 
      where: { id: parseInt(memberId), home: { id: Number(homeId) } } 
    });
    
    if (!memberToDelete) return res.status(404).json({ message: 'El miembro no pertenece a este hogar' });
    if (memberToDelete.role === 'owner') return res.status(400).json({ message: 'No se puede eliminar al dueño' });

    await memberRepo.remove(memberToDelete);
    res.json({ message: 'Miembro eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar miembro' });
  }
});

router.get('/:homeId/member-stats', async (req, res) => {
  const { homeId } = req.params;
  
  // Consulta que agrupa por usuario y cuenta sus tareas completadas en este hogar
  const stats = await AppDataSource.getRepository(CompletionHistory)
    .createQueryBuilder("history")
    .innerJoin("history.task", "task")
    .select("history.userId", "userId")
    .addSelect("COUNT(history.id)", "count")
    .addSelect("MAX(history.completedAt)", "lastAt")
    .where("task.homeId = :homeId", { homeId })
    .groupBy("history.userId")
    .getRawMany();

  res.json(stats);
});




router.get('/:homeId/member-stats', async (req, res) => {
  const { homeId } = req.params;
  try {
    const stats = await AppDataSource.getRepository(CompletionHistory)
      .createQueryBuilder('history')
      .select('history.user_id', 'userId')
      .addSelect('COUNT(history.id)', 'count')
      .addSelect('MAX(history.completed_at)', 'lastAt')
      .innerJoin('history.task', 'task')
      .where('task.homeId = :homeId', { homeId: Number(homeId) })
      .groupBy('history.user_id')
      .getRawMany();

    
    const formattedStats = stats.map(s => ({
      userId: Number(s.userId),
      count: Number(s.count),
      lastAt: s.lastAt
    }));

    res.json(formattedStats);
  } catch (error) {
    console.error("Error en member-stats:", error);
    res.status(500).json({ error: 'No se pudieron cargar las estadísticas' });
  }
});


export default router;