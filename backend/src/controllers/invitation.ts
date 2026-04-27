import { Request, Response } from 'express';
import { AppDataSource } from '../db';
import { HomeInvitation } from '../entities/HomeInvitation';
import { HomeMember } from '../entities/HomeMember';
import { User } from '../entities/User';

export const getInvitation = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const inviteRepo = AppDataSource.getRepository(HomeInvitation);

    // Busca la invitación y trae los datos de la casa asociada (relations)
    const invitation = await inviteRepo.findOne({
      where: { inviteCode: code, status: 'pending' },
      relations: ['home'] 
    });

    if (!invitation) {
      return res.status(404).json({ message: 'Invitación no encontrada' });
    }

    // Verificar expiración
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(410).json({ message: 'La invitación ha expirado' });
    }

    
    res.json({
      id: invitation.id,
      homeName: invitation.home.name,
      role: invitation.role,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  const { code } = req.params;
  const userId = (req as any).user.id; 

  // Se inicia un "QueryRunner" para manejar la transacción (asegurar que todo se guarde o nada se guarde)
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const inviteRepo = queryRunner.manager.getRepository(HomeInvitation);
    const memberRepo = queryRunner.manager.getRepository(HomeMember);

    //Validar invitación
    const invitation = await inviteRepo.findOne({
      where: { inviteCode: code, status: 'pending' },
      relations: ['home']
    });

    if (!invitation) throw new Error('Invitación no válida');

    //Crear el nuevo miembro
    const newMember = new HomeMember();
    newMember.user = { id: userId } as User;
    newMember.home = invitation.home;
    newMember.role = invitation.role;

    await memberRepo.save(newMember);

    //Actualizar el estado de la invitación
    invitation.status = 'accepted';
    await inviteRepo.save(invitation);

  
    await queryRunner.commitTransaction();
    res.json({ message: 'Te has unido con éxito' });

  } catch (error: any) {
    
    await queryRunner.rollbackTransaction();
    res.status(400).json({ message: error.message || 'Error al procesar' });
  } finally {
   
    await queryRunner.release();
  }
};