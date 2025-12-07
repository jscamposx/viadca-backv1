import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as PDFDocument from 'pdfkit';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfService {
  // Colores del diseño - paleta profesional sin azul
  private readonly COLORS = {
    primary: '#2D3748', // Gris oscuro profesional
    accent: '#D97706', // Naranja/dorado
    success: '#059669', // Verde
    text: '#374151', // Gris medio
    lightGray: '#F3F4F6',
    border: '#E5E7EB',
    white: '#FFFFFF',
  };

  constructor(
    @InjectRepository(Paquete)
    private readonly paqueteRepository: Repository<Paquete>,
  ) { }

  async generarCotizacionPDF(id: string): Promise<Buffer> {
    // Obtener el paquete con todas sus relaciones
    const paquete = await this.paqueteRepository.findOne({
      where: { id },
      // IMPORTANTE: NO incluir 'mayoristas' en las relaciones para evitar mostrar esa información
      relations: ['destinos', 'imagenes', 'hotel', 'hotel.imagenes', 'itinerarios'],
    });

    if (!paquete) {
      throw new NotFoundException(`Paquete con ID ${id} no encontrado`);
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 40, bottom: 40, left: 40, right: 40 },
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      try {
        this.generarContenido(doc, paquete);
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generarContenido(doc: PDFKit.PDFDocument, paquete: Paquete) {
    // Página 1: Portada con imagen principal
    this.generarPortada(doc, paquete);

    // Página 2: Detalles del paquete
    doc.addPage();
    this.generarDetalles(doc, paquete);

    // Agregar número de páginas
    this.agregarNumeroPaginas(doc);
  }

  private generarPortada(doc: PDFKit.PDFDocument, paquete: Paquete) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Header elegante sin fondo de color
    // Logo (si existe)
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'imagenes', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 100 });
    }

    // Línea decorativa superior
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(3)
      .moveTo(40, 80)
      .lineTo(pageWidth - 40, 80)
      .stroke();

    // Título "COTIZACIÓN" - sin fondo
    doc.fontSize(40)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text('COTIZACIÓN', 40, 100, { align: 'center', width: pageWidth - 80 });

    // Fecha
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    doc.fontSize(11)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(fecha, 40, 150, { align: 'center', width: pageWidth - 80 });

    // Espacio para separación
    let y = 190;

    // Título del paquete - más prominente
    doc.fontSize(32)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(paquete.titulo, 40, y, {
        width: pageWidth - 80,
        align: 'center'
      });

    y += 50;

    // Destinos con estilo
    const destinos = paquete.destinos
      ?.sort((a, b) => a.orden - b.orden)
      .map(d => d.ciudad)
      .join(' • ');

    if (destinos) {
      doc.fontSize(16)
        .fillColor(this.COLORS.accent)
        .font('Helvetica-Bold')
        .text(destinos, 40, y, {
          width: pageWidth - 80,
          align: 'center'
        });
      y += 40;
    }

    // Duración en recuadro
    if (paquete.duracion_dias) {
      const duracionText = `${paquete.duracion_dias} días / ${paquete.duracion_dias - 1} noches`;
      const textWidth = doc.widthOfString(duracionText);
      const boxWidth = textWidth + 40;
      const boxX = (pageWidth - boxWidth) / 2;

      // Recuadro con borde
      doc.rect(boxX, y, boxWidth, 35)
        .strokeColor(this.COLORS.border)
        .lineWidth(1.5)
        .stroke();

      doc.fontSize(13)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text(duracionText, boxX, y + 10, {
          width: boxWidth,
          align: 'center'
        });

      y += 60;
    }

    // PRECIO DESTACADO - En recuadro grande y visible
    const precio = this.formatearPrecio(paquete.precio_total, paquete.moneda);

    // Recuadro para el precio
    const precioBoxHeight = 90;
    const precioBoxY = y + 20;

    doc.rect(60, precioBoxY, pageWidth - 120, precioBoxHeight)
      .fillAndStroke(this.COLORS.lightGray, this.COLORS.accent)
      .lineWidth(2);

    // Etiqueta "PRECIO TOTAL"
    doc.fontSize(12)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text('PRECIO TOTAL', 60, precioBoxY + 15, {
        width: pageWidth - 120,
        align: 'center'
      });

    // Precio en grande
    doc.fontSize(42)
      .fillColor(this.COLORS.accent)
      .font('Helvetica-Bold')
      .text(precio, 60, precioBoxY + 35, {
        width: pageWidth - 120,
        align: 'center'
      });

    y = precioBoxY + precioBoxHeight + 15;

    // Personas (si aplica)
    if (paquete.personas) {
      doc.fontSize(11)
        .fillColor(this.COLORS.text)
        .font('Helvetica-Oblique')
        .text(`Por ${paquete.personas} ${paquete.personas === 1 ? 'persona' : 'personas'}`, 60, y, {
          width: pageWidth - 120,
          align: 'center'
        });
    }
  }

  private generarDetalles(doc: PDFKit.PDFDocument, paquete: Paquete) {
    let y = 50; // Margen superior inicial para páginas nuevas
    const pageWidth = doc.page.width;

    // Sección: Fechas con diseño mejorado
    if (paquete.fecha_inicio && paquete.fecha_fin) {
      // Calculamos altura necesaria: título + cajas
      const boxHeight = 50;
      const sectionHeight = 48 + boxHeight + 30;

      // Verificamos salto
      y = this.checkPageBreak(doc, y, sectionHeight);

      // Dibujamos sección
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

      // Recuadros para fechas
      const boxWidth = (pageWidth - 160) / 2;

      // Salida
      doc.rect(60, y, boxWidth, boxHeight)
        .fillAndStroke(this.COLORS.lightGray, this.COLORS.border)
        .lineWidth(1);

      doc.fontSize(10)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
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

      y += boxHeight + 30;
    }

    // Sección: Incluye
    if (paquete.incluye) {
      // Estimación
      const contentHeight = doc.heightOfString(paquete.incluye, { width: pageWidth - 130 }) * 1.5; // *1.5 por espaciado
      y = this.checkPageBreak(doc, y, 60 + contentHeight); // 60 header

      y = this.agregarSeccion(doc, 'QUÉ INCLUYE', y);
      y = this.agregarTextoConViñetas(doc, paquete.incluye, y);
      y += 20;
    }

    // Sección: No Incluye
    if (paquete.no_incluye) {
      const contentHeight = doc.heightOfString(paquete.no_incluye, { width: pageWidth - 130 }) * 1.5;
      y = this.checkPageBreak(doc, y, 60 + contentHeight);

      y = this.agregarSeccion(doc, 'QUÉ NO INCLUYE', y);
      y = this.agregarTextoConViñetas(doc, paquete.no_incluye, y);
      y += 20;
    }

    // Sección: Hotel
    if (paquete.hotel) {
      y = this.checkPageBreak(doc, y, 100);

      y = this.agregarSeccion(doc, 'HOSPEDAJE', y);

      doc.fontSize(14)
        .fillColor(this.COLORS.primary)
        .font('Helvetica-Bold')
        .text(paquete.hotel.nombre, 60, y);

      y += 20;

      if (paquete.hotel.estrellas) {
        const estrellas = '⭐'.repeat(Math.floor(paquete.hotel.estrellas));
        doc.fontSize(12)
          .fillColor(this.COLORS.accent)
          .text(estrellas, 60, y);
        y += 25;
      }
    }

    // Sección: Itinerario con diseño mejorado
    if (paquete.itinerarios && paquete.itinerarios.length > 0) {
      y = this.checkPageBreak(doc, y, 60);

      y = this.agregarSeccion(doc, 'ITINERARIO DETALLADO', y);

      // Ordenar itinerarios por día
      const itinerariosOrdenados = [...paquete.itinerarios].sort(
        (a, b) => a.dia_numero - b.dia_numero
      );

      itinerariosOrdenados.forEach((itinerario, index) => {
        // Calcular altura estimada de este día
        const diaBoxHeight = 30;
        const descTextoHeight = Math.max(
          doc.heightOfString(itinerario.descripcion, {
            width: pageWidth - 140,
            lineGap: 2
          }) + 20,
          40
        );
        const totalDayHeight = diaBoxHeight + 5 + descTextoHeight + 15;

        // Verificar si cabe TODO el día junto
        y = this.checkPageBreak(doc, y, totalDayHeight);

        // --- Renderizar Día ---

        // Recuadro para el día con fondo de color
        const diaBoxWidth = 80;

        doc.rect(60, y, diaBoxWidth, diaBoxHeight)
          .fill(this.COLORS.accent);

        // Número de día en blanco dentro del recuadro
        doc.fontSize(14)
          .fillColor(this.COLORS.white)
          .font('Helvetica-Bold')
          .text(`DÍA ${itinerario.dia_numero}`, 60, y + 8, {
            width: diaBoxWidth,
            align: 'center'
          });

        // Descripción con fondo suave
        const descY = y + diaBoxHeight + 5;

        // Recuadro de fondo para la descripción
        doc.rect(60, descY, pageWidth - 120, descTextoHeight)
          .fillAndStroke(this.COLORS.lightGray, this.COLORS.border)
          .lineWidth(0.5);

        // Texto de la descripción
        doc.fontSize(11)
          .fillColor(this.COLORS.text)
          .font('Helvetica')
          .text(itinerario.descripcion, 70, descY + 10, {
            width: pageWidth - 140,
            align: 'left',
            lineGap: 2
          });

        y = descY + descTextoHeight + 15;
      });

      y += 10;
    }

    // Sección: Requisitos
    if (paquete.requisitos) {
      const contentHeight = doc.heightOfString(paquete.requisitos, { width: pageWidth - 130 }) * 1.5;
      y = this.checkPageBreak(doc, y, 60 + contentHeight);

      y = this.agregarSeccion(doc, 'REQUISITOS', y);
      y = this.agregarTextoConViñetas(doc, paquete.requisitos, y);
      y += 20;
    }

    // Sección: Notas
    if (paquete.notas) {
      const w = pageWidth - 100;
      const contentHeight = doc.heightOfString(paquete.notas, { width: w, lineGap: 3 }) + 10;
      y = this.checkPageBreak(doc, y, 60 + contentHeight);

      y = this.agregarSeccion(doc, 'NOTAS IMPORTANTES', y);
      y = this.agregarTexto(doc, paquete.notas, y);
    }

    // Pie de página con información de contacto
    this.agregarPieDePagina(doc);
  }

  private agregarSeccion(doc: PDFKit.PDFDocument, titulo: string, y: number): number {
    const pageWidth = doc.page.width;

    // Línea decorativa más prominente
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(3)
      .moveTo(40, y)
      .lineTo(140, y)
      .stroke();

    // Título de la sección más grande
    doc.fontSize(18)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(titulo, 40, y + 12);

    return y + 48;
  }

  private agregarTexto(doc: PDFKit.PDFDocument, texto: string, y: number): number {
    const pageWidth = doc.page.width;
    const maxWidth = pageWidth - 100;

    doc.fontSize(11)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(texto, 60, y, {
        width: maxWidth,
        align: 'left',
        lineGap: 3
      });

    return y + doc.heightOfString(texto, { width: maxWidth, lineGap: 3 }) + 10;
  }

  private agregarTextoConViñetas(doc: PDFKit.PDFDocument, texto: string, y: number): number {
    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
    const pageWidth = doc.page.width;
    const maxWidth = pageWidth - 130;

    lineas.forEach((linea) => {
      // Calcular altura de la línea para verificar salto (usando +15 como buffer por renglón)
      const lineaHeight = doc.heightOfString(linea.trim(), { width: maxWidth, lineGap: 2 });
      y = this.checkPageBreak(doc, y, lineaHeight + 10);

      // Círculo como viñeta (más visible que un punto)
      doc.circle(67, y + 5, 3)
        .fill(this.COLORS.accent);

      // Texto
      doc.fontSize(11)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text(linea.trim(), 85, y, {
          width: maxWidth,
          align: 'left',
          lineGap: 2
        });

    });

    return y;
  }

  // Helper para controlar saltos de página dinámicos
  private checkPageBreak(doc: PDFKit.PDFDocument, y: number, heightNeeded: number): number {
    const pageHeight = doc.page.height;
    const margin = 40; // Margen inferior
    const limit = pageHeight - margin - 50; // Dejar espacio para pie de página

    if (y + heightNeeded > limit) {
      doc.addPage();
      // Reiniciar y para la nueva página (margen superior)
      return 50;
    }
    return y;
  }

  private agregarPieDePagina(doc: PDFKit.PDFDocument) {
    const pageHeight = doc.page.height;
    // ...Rest of footer logic stays similar but we treat it as absolute positioning usually
    // But let's check the original code. It uses absolute y calculation.
    // We only need to ensure we don't write *over* it.
    // The checkPageBreak limit ensures that.

    // Pie de página manual para cada página existente
    // (Este método se llamaba una sola vez al final, recorriendo las páginas)
    // El original estaba bien, solo reescribimos el contenido.

    const pageWidth = doc.page.width;
    const y = pageHeight - 70;

    // Línea superior decorativa
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(2)
      .moveTo(40, y)
      .lineTo(pageWidth - 40, y)
      .stroke();

    // Información de contacto en formato más limpio
    doc.fontSize(9)
      .fillColor(this.COLORS.text)
      .font('Helvetica-Bold')
      .text('CONTACTO', 40, y + 12);

    doc.fontSize(8)
      .font('Helvetica')
      .fillColor(this.COLORS.text)
      .text('contacto@viadca.com  |  +52 618 123 4567  |  www.viadca.com', 40, y + 28, {
        align: 'center',
        width: pageWidth - 80
      });
  }

  private agregarNumeroPaginas(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      doc.fontSize(9)
        .fillColor(this.COLORS.text)
        .font('Helvetica')
        .text(
          `Página ${i + 1} de ${pageCount}`,
          40,
          doc.page.height - 30,
          { align: 'right', width: doc.page.width - 80 }
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
