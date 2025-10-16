export interface PaqueteAccesoEmailData {
  nombreUsuario: string;
  tituloPaquete: string;
  codigoUrl: string;
  destinos: string;
  duracionDias: number;
  precioTotal: number;
  moneda: string;
  primeraImagen?: string;
  fechaInicio?: string;
  fechaFin?: string;
  frontendUrl: string; // URL del frontend para ver el paquete
}

export function generarEmailAccesoPaquete(data: PaqueteAccesoEmailData): string {
  const {
    nombreUsuario,
    tituloPaquete,
    codigoUrl,
    destinos,
    duracionDias,
    precioTotal,
    moneda,
    primeraImagen,
    fechaInicio,
    fechaFin,
    frontendUrl,
  } = data;

  const urlPaquete = `${frontendUrl}/paquetes/${codigoUrl}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nuevo Paquete Exclusivo Disponible</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; padding: 20px 0;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header con Gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                🎉 ¡Nuevo Paquete Exclusivo!
              </h1>
              <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.95;">
                Tienes acceso a una experiencia única
              </p>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding: 30px 30px 20px 30px;">
              <p style="margin: 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hola <strong style="color: #667eea;">${nombreUsuario}</strong>,
              </p>
              <p style="margin: 15px 0 0 0; color: #666666; font-size: 15px; line-height: 1.6;">
                ¡Excelentes noticias! Se te ha otorgado acceso exclusivo a un paquete privado especialmente seleccionado para ti.
              </p>
            </td>
          </tr>

          <!-- Imagen del Paquete -->
          ${primeraImagen ? `
          <tr>
            <td style="padding: 0 30px;">
              <img src="${primeraImagen}" alt="${tituloPaquete}" style="width: 100%; max-width: 540px; height: 300px; object-fit: cover; border-radius: 8px; display: block;" />
            </td>
          </tr>
          ` : ''}

          <!-- Detalles del Paquete -->
          <tr>
            <td style="padding: 30px;">
              <!-- Título -->
              <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px; font-weight: 700; text-align: center;">
                ${tituloPaquete}
              </h2>

              <!-- Info Grid -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px;">
                <tr>
                  <td width="50%" style="padding: 10px; vertical-align: top;">
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        📍 Destinos
                      </p>
                      <p style="margin: 5px 0 0 0; color: #333333; font-size: 15px; font-weight: 600;">
                        ${destinos}
                      </p>
                    </div>
                    
                    ${fechaInicio && fechaFin ? `
                    <div>
                      <p style="margin: 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        📅 Fechas
                      </p>
                      <p style="margin: 5px 0 0 0; color: #333333; font-size: 15px; font-weight: 600;">
                        ${fechaInicio} - ${fechaFin}
                      </p>
                    </div>
                    ` : ''}
                  </td>
                  
                  <td width="50%" style="padding: 10px; vertical-align: top;">
                    <div style="margin-bottom: 15px;">
                      <p style="margin: 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        ⏱️ Duración
                      </p>
                      <p style="margin: 5px 0 0 0; color: #333333; font-size: 15px; font-weight: 600;">
                        ${duracionDias} días
                      </p>
                    </div>
                    
                    <div>
                      <p style="margin: 0; color: #999999; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                        💰 Precio
                      </p>
                      <p style="margin: 5px 0 0 0; color: #667eea; font-size: 20px; font-weight: 700;">
                        $${precioTotal.toLocaleString('es-MX')} ${moneda}
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Badge de Exclusividad -->
              <div style="margin: 25px 0; text-align: center;">
                <span style="display: inline-block; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: #ffffff; padding: 8px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; letter-spacing: 0.5px;">
                  ⭐ ACCESO EXCLUSIVO
                </span>
              </div>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${urlPaquete}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                  Ver Detalles del Paquete
                </a>
              </div>

              <!-- Nota -->
              <p style="margin: 25px 0 0 0; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; color: #856404; font-size: 14px; line-height: 1.6; border-radius: 4px;">
                <strong>💡 Nota:</strong> Este paquete es privado y solo está disponible para usuarios autorizados. Asegúrate de iniciar sesión para ver todos los detalles.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px;">
                ¿Tienes preguntas? Contáctanos
              </p>
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Viajes DCA. Todos los derechos reservados.
              </p>
              <div style="margin-top: 15px;">
                <a href="${frontendUrl}" style="color: #667eea; text-decoration: none; font-size: 13px; margin: 0 10px;">
                  Explorar más paquetes
                </a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
