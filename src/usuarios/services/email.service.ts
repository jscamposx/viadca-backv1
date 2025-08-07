import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private recentlySent = new Map<string, number>();

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: '686653001@smtp-brevo.com',
        pass: 'wbH7NAYdMnD1FvqI',
      },
    });
  }


  private wasRecentlySent(email: string, type: string): boolean {
    const key = `${email}:${type}`;
    const lastSent = this.recentlySent.get(key);

    if (lastSent) {
      const timeDiff = Date.now() - lastSent;
 
      if (timeDiff < 30000) {
        this.logger.warn(`Email ${type} duplicado bloqueado para: ${email}`);
        return true;
      }
    }


    this.recentlySent.set(key, Date.now());

 
    this.cleanOldEntries();

    return false;
  }

 
  private cleanOldEntries(): void {
    const fiveMinutesAgo = Date.now() - 300000;
    for (const [key, timestamp] of this.recentlySent.entries()) {
      if (timestamp < fiveMinutesAgo) {
        this.recentlySent.delete(key);
      }
    }
  }

  async sendVerificationEmail(
    email: string,
    token: string,
    nombre?: string,
  ): Promise<void> {
    if (this.wasRecentlySent(email, 'verification')) {
      return; 
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email?token=${token}`;

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Verifica tu cuenta - Viadca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3498DB;">¡Bienvenido a Viadca!</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : '<p>Hola,</p>'}
          <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro, necesitas verificar tu correo electrónico.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #3498DB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar Correo
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Si no te registraste en Viadca, puedes ignorar este correo.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de verificación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de verificación a ${email}:`,
        error,
      );
      throw new Error('No se pudo enviar el email de verificación');
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    nombre?: string,
  ): Promise<void> {
    if (this.wasRecentlySent(email, 'reset')) {
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contraseña?token=${token}`;

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Restablece tu contraseña - Viadca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #E74C3C;">Restablecimiento de contraseña</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : '<p>Hola,</p>'}
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de Viadca.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #E74C3C; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #666; font-size: 12px;">
            Este enlace expirará en 1 hora por seguridad.
          </p>
          <p style="color: #666; font-size: 12px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
            <a href="${resetUrl}">${resetUrl}</a>
          </p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Si no solicitaste este restablecimiento, puedes ignorar este correo. Tu contraseña no se modificará.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de restablecimiento enviado a: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de restablecimiento a ${email}:`,
        error,
      );
      throw new Error('No se pudo enviar el email de restablecimiento');
    }
  }

  async sendWelcomeEmail(email: string, nombre?: string): Promise<void> {

    if (this.wasRecentlySent(email, 'welcome')) {
      return;
    }

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: '¡Cuenta verificada exitosamente! - Viadca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27AE60;">¡Cuenta verificada!</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : '<p>Hola,</p>'}
          <p>Tu correo electrónico ha sido verificado exitosamente. Ya puedes acceder a todas las funcionalidades de Viadca.</p>
          <p>Tu cuenta tiene el rol de <strong>pre-autorizado</strong>. Un administrador revisará tu cuenta y podrá otorgarte acceso completo al sistema.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background-color: #27AE60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            ¡Gracias por unirte a Viadca!
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de bienvenida enviado a: ${email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de bienvenida a ${email}:`,
        error,
      );
   
    }
  }
}
