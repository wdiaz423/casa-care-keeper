import { Router, Request, Response } from 'express';
import { AppDataSource } from '../db';
import { User } from '../entities/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(User);
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const existing = await repo.findOne({ where: { email } });
    if (existing) return res.status(409).json({ error: 'email already registered' });
    const hash = await bcrypt.hash(password, 10);
    const user = repo.create({ email, passwordHash: hash });
    await repo.save(user);
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: 'could not create user', details: err });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(User);
  const { email, password } = req.body;
  
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    const user = await repo.findOne({ where: { email } });
    
    // Verificar si el usuario existe
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si tiene password (por si es de Google)
    if (!user.passwordHash) {
      return res.status(400).json({ 
        message: 'Este usuario no tiene contraseña (intenta entrar con Google)' 
      });
    }

    // Verificar si la contraseña es correcta
    const valid = await bcrypt.compare(password, user.passwordHash);
    
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const secret = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign({ userId: user.id, email: user.email }, secret, { expiresIn: '7d' });
    
    res.json({ token, user: { id: user.id, email: user.email } });
    
  } catch (err) {
    res.status(500).json({ error: 'login failed', details: err });
  }
});




router.get('/', async (req: Request, res: Response) => {
  const users = await AppDataSource.getRepository(User).find();
  res.json(users.map((u) => ({ id: u.id, email: u.email })));
});



router.put('/profile', async (req, res) => {
  try {
    const userId = (req as any).user.id; 
    const { name, avatarUrl } = req.body;

    const userRepo = AppDataSource.getRepository(User);
  
    const user = await userRepo.findOneBy({ id: userId });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.name = name;
    

    await userRepo.save(user);

    res.json({ message: 'Perfil actualizado con éxito', user });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil' });
  }
});


export default router;
