import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contacto } from '../../entities/contacto.entity';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private recentlySent = new Map<string, number>();

  private logoPath: string | null;
  private readonly logoCid = 'logo';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Contacto) private readonly contactoRepo: Repository<Contacto>,
  ) {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp-relay.brevo.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const secureEnv = this.configService.get<string>('SMTP_SECURE');
    const secure = secureEnv ? secureEnv === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER') || '686653001@smtp-brevo.com';
    const pass = this.configService.get<string>('SMTP_PASS') || 'wbH7NAYdMnD1FvqI';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    this.logoPath = this.resolveLogoPath();
  }

  private async getSoporteEmail(): Promise<string | null> {
    try {
      const contacto = await this.contactoRepo.findOne({ where: {} });
      return contacto?.correo_electronico ?? null;
    } catch (e) {
      this.logger.warn('No se pudo obtener email de contacto desde Contacto');
      return null;
    }
  }

  // Construye enlaces de redes sociales si existen en Contacto
  private buildSocialLinks(contacto?: Contacto | null): string {
    if (!contacto) return '';
    const links: string[] = [];
    if (contacto.facebook) links.push(`<a href="${contacto.facebook}" style="color:#3498DB;text-decoration:none;" target="_blank" rel="noopener">Facebook</a>`);
    if (contacto.instagram) links.push(`<a href="${contacto.instagram}" style="color:#3498DB;text-decoration:none;" target="_blank" rel="noopener">Instagram</a>`);
    if (contacto.tiktok) links.push(`<a href="${contacto.tiktok}" style="color:#3498DB;text-decoration:none;" target="_blank" rel="noopener">TikTok</a>`);
    if (contacto.youtube) links.push(`<a href="${contacto.youtube}" style="color:#3498DB;text-decoration:none;" target="_blank" rel="noopener">YouTube</a>`);
    if (!links.length) return '';
    return `<p style="color:#6c757d;font-size:12px;margin:8px 0 0;">Síguenos: ${links.join(' · ')}</p>`;
  }

  private getFrom(): { name: string; address: string } {
    const name = this.configService.get<string>('SMTP_FROM_NAME') || 'Viadca Sistema';
    const address =
      this.configService.get<string>('SMTP_FROM_EMAIL') ||
      this.configService.get<string>('SMTP_USER') ||
      '686653001@smtp-brevo.com';
    return { name, address };
  }

  private resolveLogoPath(): string | null {
    const candidateFiles = [
      [
        'dist/assets/imagenes/logo.png',
        'dist/src/assets/imagenes/logo.png',
        'src/assets/imagenes/logo.png',
      ],
      [
        'dist/assets/imagenes/logo.avif',
        'dist/src/assets/imagenes/logo.avif',
        'src/assets/imagenes/logo.avif',
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
      'Logo (avif/png) no encontrado en rutas esperadas. Se enviarán emails sin imagen adjunta.',
    );
    return null;
  }

  private buildFooterTemplate = async (): Promise<string> => {
    // Obtener contacto para correo de soporte y redes
    let contacto: Contacto | null = null;
    try {
      contacto = await this.contactoRepo.findOne({ where: {} });
    } catch {}

    const soporte = contacto?.correo_electronico ?? (await this.getSoporteEmail());
    const noReply = `<p style="color:#6c757d;font-size:12px;margin:0;">Este es un correo automático del sistema. Por favor, no respondas a este mensaje.</p>`;
    const soporteBlock = soporte
      ? `<p style="color:#6c757d;font-size:12px;margin:4px 0 0;">Si tienes dudas o necesitas asistencia, contáctanos a <a href="mailto:${soporte}" style="color:#3498DB;text-decoration:none;">${soporte}</a>.</p>`
      : '';
    const socials = this.buildSocialLinks(contacto);
    return `
      <div style="text-align:center;margin-top:24px;">
        ${noReply}
        ${soporteBlock}
        ${socials}
      </div>
    `;
  };

  private async getEmailTemplate(
    content: string,
    title: string,
    color: string = '#3498DB',
  ): Promise<string> {
    const footer = await this.buildFooterTemplate();
    const preheader = `${title} · Viadca`;
    return `
      <div style="background-color:#eef2f7;padding:24px 12px;">
        <!-- Preheader (oculto en la mayoría de clientes) -->
        <div style="display:none;max-height:0px;overflow:hidden;font-size:1px;line-height:1px;color:#fff;opacity:0;">${preheader}</div>

        <div style="font-family:'Segoe UI', Arial, Tahoma, sans-serif; max-width: 640px; margin: 0 auto;">
          <div style="background-color: #ffffff; padding: 0; border-radius: 12px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); border:1px solid #e9edf3; overflow:hidden;">
            <!-- Header con Logo -->
            <div style="text-align: center; background: linear-gradient(135deg, ${color} 0%, #2d6cdf 100%); padding: 28px 20px;">
              ${this.logoPath ? `<img src="cid:${this.logoCid}" alt="Viadca" style="max-width: 200px; height: auto; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.15));">` : '<h2 style="margin:0;color:#fff;">Viadca</h2>'}
            </div>

            <!-- Contenido -->
            <div style="background-color: #ffffff; padding: 32px 28px;">
              <h2 style="color: #111827; margin: 0 0 16px; font-size: 22px; text-align: center;">${title}</h2>
              <div style="color:#374151; font-size:15px; line-height:1.6;">
                ${content}
              </div>
              ${footer}
            </div>

            <!-- Footer corporativo -->
            <div style="text-align: center; color: #6b7280; font-size: 12px; background:#f9fafb; padding: 16px 12px; border-top:1px solid #eef2f7;">
              <p style="margin: 0;">© ${new Date().getFullYear()} Viadca. Todos los derechos reservados.</p>
              <p style="margin: 6px 0 0;">Sistema de gestión de viajes y paquetes turísticos</p>
            </div>
          </div>
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

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verificar-correo?token=${token}`;

    const content = `
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style="font-size: 16px;">Hola,</p>'}
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

    const text = `Hola${nombre ? ` ${nombre}` : ''},\n\n` +
      'Gracias por registrarte en nuestra plataforma. Para completar tu registro, verifica tu correo electrónico.\n\n' +
      `Verificar correo: ${verificationUrl}\n\n` +
      'Si no te registraste en Viadca, puedes ignorar este correo.';

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
      from: this.getFrom(),
      to: email,
      subject: 'Verifica tu cuenta - Viadca',
      html: await this.getEmailTemplate(content, '¡Bienvenido a Viadca!', '#3498DB'),
      text,
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
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style="font-size: 16px;">Hola,</p>'}
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

    const text = `Hola${nombre ? ` ${nombre}` : ''},\n\n` +
      'Recibimos una solicitud para restablecer tu contraseña.\n' +
      'Este enlace expirará en 1 hora.\n\n' +
      `Restablecer contraseña: ${resetUrl}\n\n` +
      'Si no solicitaste este restablecimiento, ignora este correo.';

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
      from: this.getFrom(),
      to: email,
      subject: 'Restablece tu contraseña - Viadca',
      html: await this.getEmailTemplate(
        content,
        'Restablecimiento de contraseña',
        '#E74C3C',
      ),
      text,
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

    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/iniciar-sesion`;

    const content = `
      ${nombre ? `<p style=\"font-size: 16px;\">Hola ${nombre},</p>` : '<p style="font-size: 16px;">Hola,</p>'}
      <p>🎉 <strong>¡Tu correo electrónico ha sido verificado exitosamente!</strong></p>
      <p>Ya puedes acceder a todas las funcionalidades de Viadca. Tu cuenta tiene el rol de <strong>pre-autorizado</strong>.</p>
      <div style=\"background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27AE60;\">
        <p style=\"margin: 0; color: #495057;\">
          <strong>Próximos pasos:</strong><br>
          Un administrador revisará tu cuenta y podrá otorgarte acceso completo al sistema.
        </p>
      </div>
      <div style=\"text-align: center; margin: 30px 0;\">
        <a href=\"${loginUrl}\" 
           style=\"background-color: #27AE60; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; font-size: 16px;\">
          Iniciar Sesión
        </a>
      </div>
      <p style=\"color: #666; font-size: 14px; text-align: center;\">
        ¡Gracias por unirte a Viadca! Estamos emocionados de tenerte en nuestra plataforma.
      </p>
    `;

    const text = `Hola${nombre ? ` ${nombre}` : ''},\n\n` +
      '¡Tu correo electrónico ha sido verificado exitosamente!\n' +
      'Ya puedes iniciar sesión en Viadca.\n\n' +
      `Iniciar sesión: ${loginUrl}`;

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
      from: this.getFrom(),
      to: email,
      subject: '¡Cuenta verificada exitosamente! - Viadca',
      html: await this.getEmailTemplate(content, '¡Cuenta verificada!', '#27AE60'),
      text,
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
