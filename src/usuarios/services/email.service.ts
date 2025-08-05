import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false, // true para puerto 465, false para otros puertos
      auth: {
        user: '686653001@smtp-brevo.com',
        pass: 'wbH7NAYdMnD1FvqI',
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, nombre?: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-email?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Verificación de correo electrónico - Viadca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E5BBA;">¡Bienvenido a Viadca!</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : '<p>Hola,</p>'}
          <p>Gracias por registrarte en nuestro sistema. Para completar tu registro, necesitas verificar tu correo electrónico.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2E5BBA; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verificar Correo Electrónico
            </a>
          </div>
          <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este enlace expirará en 24 horas. Si no solicitaste esta verificación, puedes ignorar este correo.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de verificación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email de verificación a ${email}:`, error);
      throw new Error('No se pudo enviar el email de verificación');
    }
  }

  async sendPasswordResetEmail(email: string, token: string, nombre?: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/restablecer-contraseña?token=${token}`;
    
    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Restablecer contraseña - Viadca',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2E5BBA;">Restablecer contraseña</h2>
          ${nombre ? `<p>Hola ${nombre},</p>` : '<p>Hola,</p>'}
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Este enlace expirará en 1 hora. Si no solicitaste este restablecimiento, puedes ignorar este correo.
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de restablecimiento enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email de restablecimiento a ${email}:`, error);
      throw new Error('No se pudo enviar el email de restablecimiento');
    }
  }

  async sendWelcomeEmail(email: string, nombre?: string): Promise<void> {
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
      this.logger.error(`Error enviando email de bienvenida a ${email}:`, error);
      // No lanzamos error aquí porque es menos crítico
    }
  }
}
