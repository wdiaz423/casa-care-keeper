import { Router } from 'express';
import { AppDataSource } from '../db'; 
import { HomeInvitation } from '../entities/HomeInvitation';
import { HomeMember } from '../entities/HomeMember';
import { User } from '../entities/User';

import { sendInviteEmail } from '../lib/mail';
import { randomBytes } from 'crypto'

const router = Router();

// Ruta para crear una invitación
router.post('/', async (req: any, res: any) => {
  const { homeId, email, role } = req.body;
  const inviterId = req.user.id;
  const code = randomBytes(3).toString('hex').toUpperCase();

  try {
    const inviteRepo = AppDataSource.getRepository(HomeInvitation);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase(); // Código de 6 caracteres

    const invitation = inviteRepo.create({
      home: { id: homeId },
      email,
      role: role || 'member',
      inviteCode: code,
      invitedBy: { id: inviterId },
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      status: 'pending'
    });

    await inviteRepo.save(invitation);

    // Si hay email, enviamos el correo
    if (email) {
      // Necesitarás obtener el nombre del hogar para el correo
      await sendInviteEmail(email, "Tu Hogar", code);
    }

    res.json({ code });
  } catch (err) {
    res.status(500).json({ error: "No se pudo crear la invitación" });
  }
});



//  (GET /api/invitations/:code)
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const repo = AppDataSource.getRepository(HomeInvitation);

  const invite = await repo.findOne({ 
    where: { inviteCode: code, status: 'pending' },
    relations: ['home'] 
  });

  if (!invite) return res.status(404).json({ message: "Invitación no encontrada" });
  
  if (new Date() > invite.expiresAt) {
    invite.status = 'expired';
    await repo.save(invite);
    return res.status(410).json({ message: "La invitación ha expirado" });
  }

  res.json({
    homeName: invite.home.name,
    role: invite.role
  });
});

// (POST /api/invitations/:code/accept)
router.post('/:code/accept', async (req, res) => {
  const { code } = req.params;
  const userId = (req as any).user.id;

  const inviteRepo = AppDataSource.getRepository(HomeInvitation);
  const memberRepo = AppDataSource.getRepository(HomeMember);

  const invite = await inviteRepo.findOne({ 
    where: { inviteCode: code, status: 'pending' },
    relations: ['home'] 
  });

  if (!invite) return res.status(404).json({ message: "Invitación no válida" });

  const newMember = new HomeMember();
  newMember.user = { id: userId } as User;
  newMember.home = invite.home;
  newMember.role = invite.role;

  await memberRepo.save(newMember);

  // Marcar invitación como usada
  invite.status = 'accepted';
  await inviteRepo.save(invite);

  res.json({ message: "Te has unido con éxito" });
});

export default router;