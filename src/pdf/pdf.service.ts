import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  // Colores del diseño - paleta Azul Profesional
  private readonly COLORS = {
    primary: '#1E3A8A',
    accent: '#3B82F6',
    success: '#059669',
    text: '#334155',
    lightGray: '#F1F5F9',
    border: '#CBD5E1',
    white: '#FFFFFF',
  };

  constructor(
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
  ) { }

  async generarCotizacionPDF(id: string): Promise<Buffer> {
    const paquete = await this.paqueteRepository.findOne({
      where: { id },
      relations: ['destinos', 'imagenes', 'hotel', 'hotel.imagenes', 'itinerarios'],
    });

    if (!paquete) {
      throw new NotFoundException(`Paquete con ID ${id} no encontrado`);
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 60, left: 40, right: 40 },
        bufferPages: true,
        autoFirstPage: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      try {
        // Configurar fuentes base
        doc.font('Helvetica');

        // Generar contenido
        this.generarContenido(doc, paquete);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generarContenido(doc: PDFKit.PDFDocument, paquete: Paquete) {
    // Página 1: Portada
    this.generarPortada(doc, paquete);

    // Generar detalles en las páginas siguientes
    this.generarDetalles(doc, paquete);

    // Agregar número de páginas y pie de página DESPUÉS de generar todo el contenido
    this.agregarNumeroPaginas(doc);
    this.agregarPieDePagina(doc);
  }

  private generarPortada(doc: PDFKit.PDFDocument, paquete: Paquete) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Header
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'imagenes', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 100 });
    }

    // Línea decorativa superior
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(1.5)
      .moveTo(40, 80)
      .lineTo(pageWidth - 40, 80)
      .stroke();

    // Título "COTIZACIÓN"
    doc.fontSize(36)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text('COTIZACIÓN', 0, 100, {
        align: 'center',
        width: pageWidth
      });

    // Fecha
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(11)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(fecha, 0, 145, {
        align: 'center',
        width: pageWidth
      });

    // Título del paquete (centrado verticalmente)
    const startY = 200;
    let y = startY;

    doc.fontSize(28)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(paquete.titulo, 40, y, {
        width: pageWidth - 80,
        align: 'center'
      });

    y += doc.heightOfString(paquete.titulo, { width: pageWidth - 80 }) + 20;

    // Destinos
    const destinos = paquete.destinos
      ?.sort((a, b) => a.orden - b.orden)
      .map(d => d.ciudad)
      .join(' • ');

    if (destinos) {
      doc.fontSize(14)
        .fillColor(this.COLORS.accent)
        .font('Helvetica-Bold')
        .text(destinos, 40, y, {
          width: pageWidth - 80,
          align: 'center'
        });
      y += 40;
    }

    // Duración
    if (paquete.duracion_dias) {
      const duracionText = `${paquete.duracion_dias} días / ${paquete.duracion_dias - 1} noches`;
      const textWidth = doc.widthOfString(duracionText);
      const boxWidth = textWidth + 60;
      const boxX = (pageWidth - boxWidth) / 2;

      doc.rect(boxX, y, boxWidth, 35)
        .strokeColor(this.COLORS.border)
        .lineWidth(1)
        .stroke();

      doc.fontSize(12)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text(duracionText, boxX, y + 10, {
          width: boxWidth,
          align: 'center'
        });

      y += 60;
    }

    // PRECIO - centrado en la mitad inferior de la página
    const precio = this.formatearPrecio(paquete.precio_total, paquete.moneda);
    const precioBoxHeight = 90;
    const precioBoxY = pageHeight / 2;

    doc.rect(60, precioBoxY, pageWidth - 120, precioBoxHeight)
      .fillAndStroke(this.COLORS.lightGray, this.COLORS.accent)
      .lineWidth(1);

    doc.fontSize(11)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text('PRECIO TOTAL', 60, precioBoxY + 15, {
        width: pageWidth - 120,
        align: 'center'
      });

    doc.fontSize(38)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(precio, 60, precioBoxY + 35, {
        width: pageWidth - 120,
        align: 'center'
      });

    // Personas
    if (paquete.personas) {
      doc.fontSize(11)
        .fillColor(this.COLORS.text)
        .font('Helvetica-Oblique')
        .text(`Por ${paquete.personas} ${paquete.personas === 1 ? 'persona' : 'personas'}`,
          60, precioBoxY + precioBoxHeight + 15, {
          width: pageWidth - 120,
          align: 'center'
        });
    }
  }

  private generarDetalles(doc: PDFKit.PDFDocument, paquete: Paquete) {
    let y = 50;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const marginBottom = 80; // Espacio para pie de página

    // Configurar fuente base
    doc.font('Helvetica').fontSize(11);

    // Variable para controlar si ya agregamos la página de detalles
    let paginaDetallesCreada = false;

    // Función para agregar nueva página solo cuando sea necesario
    const agregarPaginaSiEsNecesario = (alturaNecesaria: number): void => {
      if (y + alturaNecesaria > pageHeight - marginBottom) {
        doc.addPage();
        y = 50;
        paginaDetallesCreada = true;
      }
    };

    // Función para agregar nueva sección con control de página
    const agregarSeccionConControl = (titulo: string, alturaContenido: number): boolean => {
      const alturaSeccion = 45 + alturaContenido + 20;
      agregarPaginaSiEsNecesario(alturaSeccion);

      // Solo agregar sección si hay espacio
      if (y + alturaSeccion <= pageHeight - marginBottom) {
        y = this.agregarSeccion(doc, titulo, y);
        return true;
      }
      return false;
    };

    // Primero, verificar si necesitamos crear la página de detalles
    // Solo crear página si hay contenido para mostrar
    const hayContenido = paquete.fecha_inicio || paquete.incluye || paquete.no_incluye ||
      paquete.hotel || (paquete.itinerarios && paquete.itinerarios.length > 0) ||
      paquete.requisitos || paquete.notas;

    if (hayContenido) {
      doc.addPage();
      y = 50;
    } else {
      // Si no hay contenido, ir directamente a términos y condiciones
      return;
    }

    // Sección: Fechas
    if (paquete.fecha_inicio && paquete.fecha_fin) {
      agregarPaginaSiEsNecesario(120);
      y = this.agregarSeccion(doc, 'FECHAS DEL VIAJE', y);

      const fechaInicio = new Date(paquete.fecha_inicio).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const fechaFin = new Date(paquete.fecha_fin).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const boxWidth = (pageWidth - 160) / 2;
      const boxHeight = 50;

      // Salida
      doc.rect(60, y, boxWidth, boxHeight)
        .fillAndStroke(this.COLORS.lightGray, this.COLORS.border)
        .lineWidth(1);

      doc.fontSize(10)
        .fillColor(this.COLORS.text)
        .text('SALIDA', 70, y + 10, { width: boxWidth - 20 });

      doc.fontSize(12)
        .fillColor(this.COLORS.primary)
        .font('Helvetica-Bold')
        .text(fechaInicio, 70, y + 26, { width: boxWidth - 20 });

      // Regreso
      const box2X = 60 + boxWidth + 40;
      doc.rect(box2X, y, boxWidth, boxHeight)
        .fillAndStroke(this.COLORS.lightGray, this.COLORS.border)
        .lineWidth(1);

      doc.fontSize(10)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text('REGRESO', box2X + 10, y + 10, { width: boxWidth - 20 });

      doc.fontSize(12)
        .fillColor(this.COLORS.primary)
        .font('Helvetica-Bold')
        .text(fechaFin, box2X + 10, y + 26, { width: boxWidth - 20 });

      y += boxHeight + 40;
    }

    // Sección: Incluye
    if (paquete.incluye && paquete.incluye.trim()) {
      doc.font('Helvetica').fontSize(11);
      const contenidoAltura = this.calcularAlturaTexto(doc, paquete.incluye, pageWidth - 130);

      if (agregarSeccionConControl('QUÉ INCLUYE', contenidoAltura)) {
        y = this.agregarTextoConViñetas(doc, paquete.incluye, y, pageWidth);
        y += 20;
      }
    }

    // Sección: No Incluye
    if (paquete.no_incluye && paquete.no_incluye.trim()) {
      doc.font('Helvetica').fontSize(11);
      const contenidoAltura = this.calcularAlturaTexto(doc, paquete.no_incluye, pageWidth - 130);

      if (agregarSeccionConControl('QUÉ NO INCLUYE', contenidoAltura)) {
        y = this.agregarTextoConViñetas(doc, paquete.no_incluye, y, pageWidth);
        y += 20;
      }
    }

    // Sección: Hotel
    if (paquete.hotel) {
      const alturaHotel = 100;
      agregarPaginaSiEsNecesario(alturaHotel);
      y = this.agregarSeccion(doc, 'HOSPEDAJE', y);

      doc.fontSize(14)
        .fillColor(this.COLORS.primary)
        .font('Helvetica-Bold')
        .text(paquete.hotel.nombre, 60, y);

      y += 25;

      if (paquete.hotel.estrellas) {
        const estrellas = '⭐'.repeat(Math.floor(paquete.hotel.estrellas));
        doc.fontSize(12)
          .fillColor(this.COLORS.accent)
          .text(estrellas, 60, y);
        y += 30;
      }
    }

    // Sección: Itinerario
    if (paquete.itinerarios && paquete.itinerarios.length > 0) {
      const itinerariosOrdenados = [...paquete.itinerarios].sort(
        (a, b) => a.dia_numero - b.dia_numero
      );

      let primeraPaginaItinerario = true;

      for (const itinerario of itinerariosOrdenados) {
        // Calcular altura necesaria para este día
        doc.font('Helvetica').fontSize(11);
        const alturaDescripcion = this.calcularAlturaTexto(doc, itinerario.descripcion, pageWidth - 150);
        const alturaTotalDia = 45 + alturaDescripcion + 30;

        agregarPaginaSiEsNecesario(alturaTotalDia);

        // Si estamos al inicio de una nueva página y es la primera vez que mostramos itinerario
        if (primeraPaginaItinerario) {
          y = this.agregarSeccion(doc, 'ITINERARIO DETALLADO', y);
          primeraPaginaItinerario = false;
        } else if (y === 50) {
          // Si ya mostramos el título pero estamos en nueva página, no mostrar título otra vez
          y += 20;
        }

        // Recuadro para el día
        const diaBoxHeight = 30;
        const diaBoxWidth = 80;

        doc.rect(60, y, diaBoxWidth, diaBoxHeight)
          .fill(this.COLORS.primary);

        doc.fontSize(12)
          .fillColor(this.COLORS.white)
          .font('Helvetica-Bold')
          .text(`DÍA ${itinerario.dia_numero}`, 60, y + 8, {
            width: diaBoxWidth,
            align: 'center'
          });

        y += diaBoxHeight + 10;

        // Descripción
        doc.rect(60, y, pageWidth - 120, alturaDescripcion + 20)
          .fillAndStroke(this.COLORS.lightGray, this.COLORS.border)
          .lineWidth(0.5);

        doc.fontSize(11)
          .fillColor(this.COLORS.text)
          .font('Helvetica')
          .text(itinerario.descripcion, 75, y + 12, {
            width: pageWidth - 150,
            align: 'left',
            lineGap: 4
          });

        y += alturaDescripcion + 35;
      }
    }

    // Sección: Requisitos
    if (paquete.requisitos && paquete.requisitos.trim()) {
      doc.font('Helvetica').fontSize(11);
      const contenidoAltura = this.calcularAlturaTexto(doc, paquete.requisitos, pageWidth - 130);

      if (agregarSeccionConControl('REQUISITOS', contenidoAltura)) {
        y = this.agregarTextoConViñetas(doc, paquete.requisitos, y, pageWidth);
        y += 20;
      }
    }

    // Sección: Notas
    if (paquete.notas && paquete.notas.trim()) {
      doc.font('Helvetica').fontSize(11);
      const contenidoAltura = this.calcularAlturaTexto(doc, paquete.notas, pageWidth - 130);

      if (agregarSeccionConControl('NOTAS IMPORTANTES', contenidoAltura)) {
        y = this.agregarTextoConViñetas(doc, paquete.notas, y, pageWidth);
        y += 20;
      }
    }

    // Sección: Términos y Condiciones (SIEMPRE al final en la MISMA página)
    // Calcular altura de términos
    const terminos = `
1. Los precios están sujetos a cambio sin previo aviso.
2. Se requiere depósito del 50% para confirmar la reserva.
3. Cancelaciones con menos de 30 días de anticipación pueden tener penalidades.
4. Los itinerarios pueden estar sujetos a cambios por condiciones climáticas o de operación.
5. Los precios no incluyen propinas ni gastos personales no especificados.
    `.trim();

    doc.font('Helvetica').fontSize(11);
    const terminosAltura = this.calcularAlturaTexto(doc, terminos, pageWidth - 130);

    // Forzar nueva página solo si no cabe en la actual
    if (y + terminosAltura + 80 > pageHeight - marginBottom) {
      doc.addPage();
      y = 50;
    }

    // Agregar términos en la última página
    y = this.agregarSeccion(doc, 'TÉRMINOS Y CONDICIONES', y);
    this.agregarTextoConViñetas(doc, terminos, y, pageWidth);
  }

  private agregarSeccion(doc: PDFKit.PDFDocument, titulo: string, y: number): number {
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(2)
      .moveTo(40, y)
      .lineTo(100, y)
      .stroke();

    doc.fontSize(16)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(titulo, 40, y + 10);

    return y + 45;
  }

  private agregarTextoConViñetas(doc: PDFKit.PDFDocument, texto: string, y: number, pageWidth: number): number {
    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
    const maxWidth = pageWidth - 130;

    lineas.forEach((linea) => {
      // Configurar fuente ANTES de medir
      doc.font('Helvetica').fontSize(11);
      const alturaLinea = doc.heightOfString(linea.trim(), {
        width: maxWidth,
        lineGap: 4
      });

      // Viñeta
      doc.save();
      doc.circle(50, y + 6, 3)
        .fill(this.COLORS.accent);
      doc.restore();

      // Texto
      doc.fontSize(11)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text(linea.trim(), 65, y, {
          width: maxWidth,
          align: 'left',
          lineGap: 4
        });

      y += alturaLinea + 8;
    });

    return y;
  }

  private calcularAlturaTexto(doc: PDFKit.PDFDocument, texto: string, ancho: number): number {
    // Configurar la fuente antes de medir
    doc.font('Helvetica').fontSize(11);
    return doc.heightOfString(texto, {
      width: ancho,
      lineGap: 4
    });
  }

  private agregarPieDePagina(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const pageHeight = doc.page.height;
      const pageWidth = doc.page.width;
      const y = pageHeight - 40;

      doc.strokeColor(this.COLORS.border)
        .lineWidth(1)
        .moveTo(40, y)
        .lineTo(pageWidth - 40, y)
        .stroke();

      doc.fontSize(9)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text('contacto@viadca.com  |  www.viadca.app', 40, y + 10, {
          align: 'center',
          width: pageWidth - 80
        });
    }
  }

  private agregarNumeroPaginas(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc.fontSize(9)
        .fillColor(this.COLORS.text)
        .text(
          `Página ${i + 1} de ${pageCount}`,
          doc.page.width - 60,
          doc.page.height - 30,
          { align: 'right' }
        );
    }
  }

  private formatearPrecio(precio: number, moneda: string): string {
    const formatter = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: moneda === 'USD' ? 'USD' : 'MXN',
      minimumFractionDigits: 2,
    });
    return formatter.format(precio);
  }
}