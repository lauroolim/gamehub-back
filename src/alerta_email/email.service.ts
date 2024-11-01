import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.mailtrap.io', // Host fornecido pelo Mailtrap
      port: 2525,               // Porta padrão do Mailtrap
      auth: {
        user: process.env.MAILTRAP_USER, // Usuário gerado no Mailtrap
        pass: process.env.MAILTRAP_PASSWORD, // Senhad que foi gerado no Mailtrap
      },
    });
  }

  async sendExpirationAlert(to: string, type: string, daysLeft: number) {
    const mailOptions = {
      from: '"GameHub" <noreply@gamehub.com>',
      to,
      subject: `Sua assinatura ${type} está expirando em ${daysLeft} dias!`,
      text: `Olá! Sua assinatura ${type} está próxima de expirar. Renove para continuar aproveitando nossos serviços.`,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`E-mail enviado: ${info.messageId}`);
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
    }
  }
}
