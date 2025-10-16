import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../usuarios/services/email.service';
import { Usuario } from '../entities/usuario.entity';
import { Paquete } from './entidades/paquete.entity';
import { generarEmailAccesoPaquete } from './templates/paquete-acceso.template';

@Injectable()
export class PaquetesNotificacionService {
  private readonly logger = new Logger(PaquetesNotificacionService.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Envía notificación de acceso a un usuario
   */
  async notificarAccesoUsuario(usuario: Usuario, paquete: Paquete): Promise<void> {
    try {
      // Obtener la URL del frontend desde variables de entorno
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      // Preparar destinos como string
      const destinosStr = paquete.destinos
        ?.sort((a, b) => a.orden - b.orden)
        .map((d: any) => `${d.ciudad}, ${d.pais}`)
        .join(' • ') || 'Múltiples destinos';

      // Obtener primera imagen
      const imagenes = paquete.imagenes?.sort((a, b) => a.orden - b.orden) || [];
      const primeraImagen = imagenes[0]?.contenido || imagenes[0]?.cloudinary_url;

      // Formatear fechas
      const formatDate = (date: Date | string | null | undefined) => {
        if (!date) return undefined;
        const d = new Date(date);
        return d.toLocaleDateString('es-MX', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric' 
        });
      };

      // Generar HTML del email
      const htmlContent = generarEmailAccesoPaquete({
        nombreUsuario: usuario.nombre_completo || usuario.usuario,
        tituloPaquete: paquete.titulo,
        codigoUrl: paquete.codigoUrl,
        destinos: destinosStr,
        duracionDias: paquete.duracion_dias,
        precioTotal: Number(paquete.precio_total),
        moneda: paquete.moneda,
        primeraImagen,
        fechaInicio: formatDate(paquete.fecha_inicio),
        fechaFin: formatDate(paquete.fecha_fin),
        frontendUrl,
      });

      // Enviar email
      await this.emailService.sendCustomEmail(
        usuario.correo,
        `🎉 Nuevo acceso exclusivo: ${paquete.titulo}`,
        htmlContent,
      );

      this.logger.log(
        `✅ Email de acceso enviado a ${usuario.correo} para paquete "${paquete.titulo}"`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error al enviar email a ${usuario.correo} para paquete "${paquete.titulo}":`,
        error,
      );
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }

  /**
   * Notifica a múltiples usuarios sobre el acceso a un paquete
   */
  async notificarAccesoMultiplesUsuarios(
    usuarios: Usuario[],
    paquete: Paquete,
  ): Promise<void> {
    const promises = usuarios.map(usuario =>
      this.notificarAccesoUsuario(usuario, paquete),
    );

    await Promise.allSettled(promises);
    
    this.logger.log(
      `📧 Enviadas ${usuarios.length} notificaciones para paquete "${paquete.titulo}"`,
    );
  }

  /**
   * Detecta nuevos usuarios autorizados comparando arrays de IDs
   */
  detectarNuevosUsuarios(
    usuariosAnteriores: Usuario[],
    usuariosNuevos: Usuario[],
  ): Usuario[] {
    const idsAnteriores = new Set(usuariosAnteriores.map(u => u.id));
    return usuariosNuevos.filter(u => !idsAnteriores.has(u.id));
  }
}
