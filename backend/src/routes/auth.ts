import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../db';
import { User } from '../entities/User';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
  const { token } = req.body; 
  
  try {
    // Valida que el token de Google 
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google Token' });
    }

    const repo = AppDataSource.getRepository(User);
    
    // BUSCA AL USUARIO en la base de datos por su email
    let user = await repo.findOne({ where: { email: payload.email } });

    //SI NO EXISTE, (Registro automático)
     const userRepo = AppDataSource.getRepository(User);

    if (!user) {  
      user = userRepo.create({
      email: payload.email,
      name: payload.name,    
      }); 
      
      await repo.save(user);
      console.log("Nuevo usuario creado vía Google:", user.email);
    }

    // GENERA EL PROPIO JWT
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const miPropioJWT = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '24h' }
    );

   
    res.json({ 
      token: miPropioJWT,
      user: { id: user.id, name: user.name, email: user.email } 
    });

  } catch (e) {
    console.error("Error en Google Auth:", e);
    res.status(401).json({ error: 'Google Auth Failed' });
  }
});


router.get('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.query; 

    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    const repo = AppDataSource.getRepository(User);

    // Buscamos al usuario que tenga ese token guardado
    const user = await repo.findOneBy({ resetPasswordToken: String(token) });

    if (!user) {
      return res.status(404).json({ error: 'El enlace no es válido o ya fue usado' });
    }

    // OPCIONAL: Validar si el token expiró (ejemplo: 2 horas de vida)
    // Suponiendo que guardaste 'resetPasswordExpires' en tu DB
    const now = new Date();
    if (user.resetPasswordExpires && now > user.resetPasswordExpires) {
      return res.status(400).json({ error: 'El enlace ha expirado' });
    }

    
    res.json({ message: 'Token válido', email: user.email });

  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});




router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOneBy({ email });
    
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

  
    const token = crypto.randomBytes(20).toString('hex');

    // Definir el TIEMPO DE VIDA (1 hora)
    const expiresIn = 1 * 60 * 60 * 1000; 
    const expiryDate = new Date(Date.now() + expiresIn);

   
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiryDate;

    await userRepo.save(user);
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userRepo = AppDataSource.getRepository(User);

    const user = await userRepo.findOneBy({ email });
    
    // Por seguridad, si el usuario no existe, puedes devolver un 200 genérico 
    // para no dar pistas de qué emails están registrados.
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    // 1. Generar un token aleatorio de 40 caracteres (20 bytes hex)
    const token = crypto.randomBytes(20).toString('hex');

    // 2. Definir el TIEMPO DE VIDA (1 hora)
    const expiresIn = 1 * 60 * 60 * 1000; 
    const expiryDate = new Date(Date.now() + expiresIn);

    // 3. Guardar en la DB
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expiryDate;

    await userRepo.save(user);

    
    // Por ahora, devolvo el token para que pruebas en Postman
    console.log(`Link de recuperación: http://localhost:5173/reset-password?token=${token}`);

    res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});
    console.log(`Link de recuperación: http://localhost:5173/reset-password?token=${token}`);

    res.json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, passwordHash } = req.body;

    if (!email || !passwordHash) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const repo = AppDataSource.getRepository(User);
    
    
    const user = await repo.findOne({ 
      where: { email },
      select: ['id', 'name', 'email', 'passwordHash'] 
    });

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

  
    const isMatch = (passwordHash === user.passwordHash); 

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
    const secret = process.env.JWT_SECRET || 'dev_secret';
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error("Error en login tradicional:", error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;