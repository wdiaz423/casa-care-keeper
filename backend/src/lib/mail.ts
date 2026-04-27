// backend/src/lib/mail.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendInviteEmail = async (email: string, homeName: string, code: string) => {
  const inviteUrl = `${process.env.FRONTEND_URL}/join/${code}`;
  
  await transporter.sendMail({
    from: '"Sakan App" <no-reply@sakan.com>',
    to: email,
    subject: `Invitación para unirse a ${homeName}`,
    html: `
      <h1>¡Has sido invitado!</h1>
      <p>Te han invitado a unirte al hogar <strong>${homeName}</strong> en Sakan.</p>
      <p>Haz clic en el siguiente enlace para aceptar la invitación:</p>
      <a href="${inviteUrl}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Aceptar Invitación</a>
      <p>O usa el código: <strong>${code}</strong></p>
    `,
  });
};