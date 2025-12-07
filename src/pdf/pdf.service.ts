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
        autoFirstPage: false,
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

        // Agregar número de páginas
        this.agregarNumeroPaginas(doc);



        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private generarContenido(doc: PDFKit.PDFDocument, paquete: Paquete) {
    // Página 1
    doc.addPage();
    this.generarPagina1(doc, paquete);

    // Página 2 (forzamos nueva página)
    doc.addPage();
    this.generarPagina2(doc, paquete);
  }

  private generarPagina1(doc: PDFKit.PDFDocument, paquete: Paquete) {
    const pageWidth = doc.page.width;
    let y = 30;

    // --- HEADER ---
    // Logo
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'imagenes', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, y, { width: 100 });
    }

    // Título "COTIZACIÓN"
    doc.fontSize(24)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text('COTIZACIÓN', 0, y + 20, {
        align: 'center',
        width: pageWidth
      });

    // Fecha
    const fecha = new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    doc.fontSize(10)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(fecha, 0, y + 50, {
        align: 'center',
        width: pageWidth
      });

    y = 120;

    // --- DETALLE DEL VIAJE ---
    this.agregarSeccion(doc, 'DETALLE DEL VIAJE', y);
    y += 35;

    // Título del paquete
    doc.fontSize(16)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(paquete.titulo, 40, y);
    y += 25;

    // Ubicación (Destinos)
    if (paquete.destinos && paquete.destinos.length > 0) {
      const destinosApp = paquete.destinos.map(d => d.ciudad).join(' • ');
      doc.fontSize(12)
        .fillColor(this.COLORS.accent)
        .font('Helvetica-Bold')
        .text(destinosApp, 40, y);
      y += 20;
    }

    // Ubicación (Origen)
    doc.fontSize(12)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(`Salida desde: ${paquete.origen}`, 40, y);
    y += 25;

    // Fechas
    if (paquete.fecha_inicio && paquete.fecha_fin) {
      const fInicio = new Date(paquete.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
      const fFin = new Date(paquete.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

      doc.fontSize(12)
        .font('Helvetica-Bold')
        .text(`Fecha de salida: ${fInicio}`, 40, y);
      y += 20;
      doc.text(`Fecha de regreso: ${fFin}`, 40, y);
      y += 40;
    }

    // --- REQUISITOS ---
    if (paquete.requisitos) {
      this.agregarSeccion(doc, 'REQUISITOS', y);
      y += 35;
      this.agregarTextoConViñetas(doc, paquete.requisitos, y, pageWidth, 450); // Limit height to avoid spill
    }
  }

  private generarPagina2(doc: PDFKit.PDFDocument, paquete: Paquete) {
    const pageWidth = doc.page.width;
    let y = 40;

    // --- IMPORTANTE ---
    this.agregarSeccion(doc, 'IMPORTANTE', y);
    y += 35;

    const importanteTxt = `Ten en cuenta que no es posible garantizar la disponibilidad ni la tarifa hasta que se concrete el pago. Recuerda que el precio final puede variar en base al medio de pago seleccionado al momento de concretar la compra.`;

    doc.fontSize(10)
      .fillColor(this.COLORS.text)
      .font('Helvetica')
      .text(importanteTxt, 40, y, { width: pageWidth - 80, align: 'justify' });

    y += 60;

    // --- TOTAL A PAGAR ---
    doc.rect(40, y, pageWidth - 80, 80)
      .fillAndStroke(this.COLORS.lightGray, this.COLORS.accent)
      .lineWidth(1);

    doc.fontSize(14)
      .fillColor(this.COLORS.text)
      .font('Helvetica-Bold')
      .text('TOTAL A PAGAR', 0, y + 15, { width: pageWidth, align: 'center' });

    const precioFmt = this.formatearPrecio(paquete.precio_total, paquete.moneda);
    doc.fontSize(24)
      .fillColor(this.COLORS.primary)
      .text(`TOTAL ${precioFmt}`, 0, y + 40, { width: pageWidth, align: 'center' });

    y += 100;

    // --- TÉRMINOS Y CONDICIONES ---
    this.agregarSeccion(doc, 'TÉRMINOS Y CONDICIONES', y);
    y += 35;

    const terminos = `Válido solo para reservas prepagas seleccionadas efectuadas a través de Viadca. Las tarifas pueden ser modificadas por las compañías aéreas y/o demás proveedores de Viadca, toda vez que las mismas solo se garantizan con el pago y la emisión del servicio. Vigencia: durante la media hora posterior al envío de este correo o hasta agotar stock de 8 cupos por destino, lo que primero suceda. Reservas no endosables ni reembolsables. No acumulable con otras promociones. Aplica un máximo de 8 personas por reserva. En caso de requerir cambios, estos se encuentran condicionados a la autorización del proveedor y de ser procedentes se aplicará la penalidad correspondiente. Valido solo para ciudadanos o residentes de México. Las tarifas incluyen: Tarifa neta, Tasa aeroportuaria, Tasa administrativa, impuestos, tasas, IVA y sobre cargo de combustible. No incluye otros impuestos o tasas. Cada pasajero es responsable de su documentación de viaje válida y de las vacunas requeridas. No acumulable con otras promociones. Para más información consulte nuestro aviso de privacidad y más detalles en Viadca, , , , Mexico.. Ver términos y condiciones en Viadca.`;

    this.agregarTextoConViñetas(doc, terminos, y, pageWidth);
  }

  // Métodos auxiliares

  private agregarSeccion(doc: PDFKit.PDFDocument, titulo: string, y: number): number {
    doc.strokeColor(this.COLORS.accent)
      .lineWidth(2)
      .moveTo(40, y + 25)
      .lineTo(doc.page.width - 40, y + 25)
      .stroke();

    doc.fontSize(14)
      .fillColor(this.COLORS.primary)
      .font('Helvetica-Bold')
      .text(titulo.toUpperCase(), 40, y);

    return y + 35;
  }

  private agregarTextoConViñetas(doc: PDFKit.PDFDocument, texto: string, y: number, pageWidth: number, maxHeight?: number): number {
    const lineas = texto.split('\n').filter(l => l.trim().length > 0);
    const maxWidth = pageWidth - 80;
    const startY = y;

    for (const linea of lineas) {
      if (maxHeight && (y - startY) > maxHeight) break;

      doc.font('Helvetica').fontSize(10).fillColor(this.COLORS.text);

      const height = doc.heightOfString(linea, { width: maxWidth });

      doc.text(linea, 40, y, {
        width: maxWidth,
        align: 'justify',
        lineGap: 2
      });

      y += height + 5;
    }
    return y;
  }



  private agregarNumeroPaginas(doc: PDFKit.PDFDocument) {
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor(this.COLORS.border).text(`${i + 1}/${pageCount}`, doc.page.width - 40, doc.page.height - 20, { align: 'right' });
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