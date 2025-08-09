import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private recentlySent = new Map<string, number>();

  private logoPath: string | null;
  private readonly logoCid = 'logo';

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

    this.logoPath = this.resolveLogoPath();
  }

  private resolveLogoPath(): string | null {
    const candidateFiles = [
      [
        'dist/assets/imagenes/logo.jpg',
        'dist/src/assets/imagenes/logo.jpg',
        'src/assets/imagenes/logo.jpg',
      ],
      [
        'dist/assets/imagenes/logo.webp',
        'dist/src/assets/imagenes/logo.webp',
        'src/assets/imagenes/logo.webp',
      ],
    ].flat();

    for (const relative of candidateFiles) {
      const abs = path.join(process.cwd(), relative);
      if (fs.existsSync(abs)) {
        this.logger.log(`Logo encontrado en: ${abs}`);
        return abs;
      }
    }
    this.logger.warn(
      'Logo (jpg/webp) no encontrado en rutas esperadas. Se enviarán emails sin imagen adjunta.',
    );
    return null;
  }

  private getEmailTemplate(
    content: string,
    title: string,
    color: string = '#3498DB',
  ): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
        <!-- Header con Logo -->
        <div style="text-align: center; background-color: white; padding: 20px; border-radius: 10px 10px 0 0; border-bottom: 3px solid ${color};">
          ${this.logoPath ? `<img src=\"cid:${this.logoCid}\" alt=\"Viadca\" style=\"max-width: 200px; height: auto;\">` : '<h2 style="margin:0;">Viadca</h2>'}
        </div>
        
        <!-- Contenido -->
        <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: ${color}; margin-top: 0; text-align: center;">${title}</h2>
          ${content}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} Viadca. Todos los derechos reservados.</p>
          <p style="margin: 5px 0;">Sistema de gestión de viajes y paquetes turísticos</p>
        </div>
      </div>
    `;
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

    const content = `
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style=\"font-size: 16px;\">Hola,</p>'}
      <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro, necesitas verificar tu correo electrónico.</p>
      <div style=\"text-align: center; margin: 30px 0;\">
        <a href=\"${verificationUrl}\" 
           style=\"background-color: #3498DB; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;\">
          Verificar Correo
        </a>
      </div>
      <p style=\"color: #666; font-size: 14px;\">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <a href=\"${verificationUrl}\" style=\"color: #3498DB;\">${verificationUrl}</a>
      </p>
      <p style=\"color: #666; font-size: 12px; margin-top: 30px;\">
        Si no te registraste en Viadca, puedes ignorar este correo.
      </p>
    `;

    const attachments = this.logoPath
      ? [
          {
            filename: path.basename(this.logoPath),
            path: this.logoPath,
            cid: this.logoCid,
          },
        ]
      : [];

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Verifica tu cuenta - Viadca',
      html: this.getEmailTemplate(content, '¡Bienvenido a Viadca!', '#3498DB'),
      attachments,
    } as nodemailer.SendMailOptions;

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

    const content = `
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style=\"font-size: 16px;\">Hola,</p>'}
      <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta de Viadca.</p>
      <div style=\"text-align: center; margin: 30px 0;\">
        <a href=\"${resetUrl}\" 
           style=\"background-color: #E74C3C; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;\">
          Restablecer Contraseña
        </a>
      </div>
      <p style=\"color: #666; font-size: 14px;\">
        <strong>⚠️ Este enlace expirará en 1 hora por seguridad.</strong>
      </p>
      <p style=\"color: #666; font-size: 14px;\">
        Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:<br>
        <a href=\"${resetUrl}\" style=\"color: #E74C3C;\">${resetUrl}</a>
      </p>
      <p style=\"color: #666; font-size: 12px; margin-top: 30px;\">
        Si no solicitaste este restablecimiento, puedes ignorar este correo. Tu contraseña no se modificará.
      </p>
    `;

    const attachments = this.logoPath
      ? [
          {
            filename: path.basename(this.logoPath),
            path: this.logoPath,
            cid: this.logoCid,
          },
        ]
      : [];

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: 'Restablece tu contraseña - Viadca',
      html: this.getEmailTemplate(
        content,
        'Restablecimiento de contraseña',
        '#E74C3C',
      ),
      attachments,
    } as nodemailer.SendMailOptions;

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

    const content = `
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style=\"font-size: 16px;\">Hola,</p>'}
      <p>🎉 <strong>¡Tu correo electrónico ha sido verificado exitosamente!</strong></p>
      <p>Ya puedes acceder a todas las funcionalidades de Viadca. Tu cuenta tiene el rol de <strong>pre-autorizado</strong>.</p>
      <div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27AE60;\">
        <p style=\"margin: 0; color: #495057;\">
          <strong>Próximos pasos:</strong><br>
          Un administrador revisará tu cuenta y podrá otorgarte acceso completo al sistema.
        </p>
      </div>
      <div style=\"text-align: center; margin: 30px 0;\">
        <a href=\"${process.env.FRONTEND_URL || 'http://localhost:3000'}/login\" 
           style=\"background-color: #27AE60; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;\">
          Iniciar Sesión
        </a>
      </div>
      <p style=\"color: #666; font-size: 14px; text-align: center;\">
        ¡Gracias por unirte a Viadca! Estamos emocionados de tenerte en nuestra plataforma.
      </p>
    `;

    const attachments = this.logoPath
      ? [
          {
            filename: path.basename(this.logoPath),
            path: this.logoPath,
            cid: this.logoCid,
          },
        ]
      : [];

    const mailOptions = {
      from: {
        name: 'Viadca Sistema',
        address: '686653001@smtp-brevo.com',
      },
      to: email,
      subject: '¡Cuenta verificada exitosamente! - Viadca',
      html: this.getEmailTemplate(content, '¡Cuenta verificada!', '#27AE60'),
      attachments,
    } as nodemailer.SendMailOptions;

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
