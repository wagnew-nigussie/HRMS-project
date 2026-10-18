import nodemailer from 'nodemailer';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';

const mailer = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : null;

export async function notify(input: { userId: string; title: string; body: string; metadata?: any }) {
  const row = await prisma.notification.create({
    data: { userId: input.userId, title: input.title, body: input.body, channel: 'IN_APP', status: 'SENT', metadata: input.metadata },
  });

  if (mailer) {
    try {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (user) {
        await mailer.sendMail({ from: 'noreply@hrms.local', to: user.email, subject: input.title, text: input.body });
      }
    } catch (e) { logger.warn({ e }, 'email failed'); }
  }
  return { id: row.id };
}

export const sendNotification = notify;
