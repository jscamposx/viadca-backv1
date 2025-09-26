import * as ExcelJS from 'exceljs';
import { Paquete } from '../../paquetes/entidades/paquete.entity';

export class PaqueteExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;
  private currentRow: number = 1;

  // Configuración directa y simple para modificar fácilmente
  private static readonly COLORS = {
    primary: '0F3D73',
    secondary: '145A9C',
    accent: 'E8F1FD',
    subtle: 'F5F8FE',
    textDark: '1C2E4A',
    textMuted: '3D5878',
    white: 'FFFFFF',
    border: 'D5E1F2',
  };

  private static readonly TEXTS = {
    mainTitle: 'INFORMACIÓN COMPLETA DEL PAQUETE TURÍSTICO',
    basicInfo: 'INFORMACIÓN BÁSICA',
    includes: 'QUÉ INCLUYE',
    notIncludes: 'QUÉ NO INCLUYE',
    requirements: 'REQUISITOS',
    notes: 'NOTAS ADICIONALES',
    destinations: 'DESTINOS DEL VIAJE',
    hotel: 'INFORMACIÓN DEL HOTEL',
    itinerary: 'ITINERARIO DETALLADO',
    wholesalers: 'MAYORISTAS ASOCIADOS',
  };

  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.setupWorkbookMetadata();
    this.createWorksheet();
  }

  private setupWorkbookMetadata(): void {
    this.workbook.creator = 'Viadca Sistema';
    this.workbook.lastModifiedBy = 'Viadca Sistema';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.company = 'Viadca';
    this.workbook.category = 'Turismo';
  }

  private createWorksheet(): void {
    this.worksheet = this.workbook.addWorksheet('Información del Paquete', {
      pageSetup: {
        paperSize: 9,
        orientation: 'portrait',
        margins: {
          left: 0.4,
          right: 0.4,
          top: 0.6,
          bottom: 0.6,
          header: 0.3,
          footer: 0.3,
        },
        printArea: 'A1:D120',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
      },
    });

    this.worksheet.columns = [
      { key: 'icon', width: 7 },
      { key: 'campo', width: 28 },
      { key: 'valor', width: 62 },
      { key: 'extra', width: 20 },
    ];
  }

  private getStyles() {
    const palette = PaqueteExcelTemplate.COLORS;

    return {
      brandHeaderStyle: {
        font: {
          name: 'Segoe UI',
          size: 24,
          bold: true,
          color: { argb: palette.white },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.primary },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: {
          bottom: { style: 'thick' as const, color: { argb: palette.secondary } },
        },
      },

      packageTitleStyle: {
        font: {
          name: 'Segoe UI',
          size: 20,
          bold: true,
          color: { argb: palette.textDark },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.accent },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: {
          top: { style: 'thin' as const, color: { argb: palette.border } },
          bottom: { style: 'thin' as const, color: { argb: palette.border } },
          left: { style: 'thin' as const, color: { argb: palette.border } },
          right: { style: 'thin' as const, color: { argb: palette.border } },
        },
      },

      sectionHeaderStyle: {
        font: {
          name: 'Segoe UI',
          size: 14,
          bold: true,
          color: { argb: palette.white },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.secondary },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'middle' as const,
          indent: 2,
        },
        border: this.getModernBorders(),
      },

      iconStyle: {
        font: {
          name: 'Segoe UI Emoji',
          size: 16,
          bold: true,
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: this.lightenColor(palette.secondary, 20) },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: this.getModernBorders(),
      },

      fieldLabelStyle: {
        font: {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: palette.textDark },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.accent },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'middle' as const,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      fieldValueStyle: {
        font: {
          name: 'Segoe UI',
          size: 11,
          color: { argb: palette.textDark },
          bold: false,
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.white },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'top' as const,
          wrapText: true,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      longTextStyle: {
        font: {
          name: 'Segoe UI',
          size: 10,
          color: { argb: palette.textDark },
          bold: false,
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.subtle },
        },
        alignment: {
          horizontal: 'justify' as const,
          vertical: 'top' as const,
          wrapText: true,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      highlightStyle: {
        font: {
          name: 'Segoe UI',
          size: 11,
          bold: false,
          color: { argb: palette.textDark },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.white },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'top' as const,
          wrapText: true,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      tableHeaderStyle: {
        font: {
          name: 'Segoe UI',
          size: 11,
          bold: true,
          color: { argb: palette.white },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.primary },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: this.getModernBorders(),
      },

      tableRowEvenStyle: {
        font: {
          name: 'Segoe UI',
          size: 10,
          color: { argb: palette.textDark },
          bold: false,
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.subtle },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'middle' as const,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      tableRowOddStyle: {
        font: {
          name: 'Segoe UI',
          size: 10,
          color: { argb: palette.textDark },
          bold: false,
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.white },
        },
        alignment: {
          horizontal: 'left' as const,
          vertical: 'middle' as const,
          indent: 1,
        },
        border: this.getSubtleBorders(),
      },

      badgeSuccessStyle: {
        font: {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: palette.white },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.secondary },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: this.getRoundedBorders(),
      },

      badgeWarningStyle: {
        font: {
          name: 'Segoe UI',
          size: 10,
          bold: true,
          color: { argb: palette.white },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: this.lightenColor(palette.secondary, 15) },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
        border: this.getRoundedBorders(),
      },

      timestampStyle: {
        font: {
          name: 'Segoe UI',
          size: 9,
          italic: true,
          color: { argb: palette.secondary },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
      },
    };
  }

  private getModernBorders() {
    const palette = PaqueteExcelTemplate.COLORS;
    return {
      top: { style: 'medium' as const, color: { argb: palette.border } },
      left: { style: 'medium' as const, color: { argb: palette.border } },
      bottom: { style: 'medium' as const, color: { argb: palette.border } },
      right: { style: 'medium' as const, color: { argb: palette.border } },
    };
  }

  private getSubtleBorders() {
    const palette = PaqueteExcelTemplate.COLORS;
    return {
      top: { style: 'thin' as const, color: { argb: palette.border } },
      left: { style: 'thin' as const, color: { argb: palette.border } },
      bottom: { style: 'thin' as const, color: { argb: palette.border } },
      right: { style: 'thin' as const, color: { argb: palette.border } },
    };
  }

  private getRoundedBorders() {
    const palette = PaqueteExcelTemplate.COLORS;
    return {
      top: { style: 'thick' as const, color: { argb: palette.white } },
      left: { style: 'thick' as const, color: { argb: palette.white } },
      bottom: { style: 'thick' as const, color: { argb: palette.white } },
      right: { style: 'thick' as const, color: { argb: palette.white } },
    };
  }

  private addBrandHeader(): void {
    const styles = this.getStyles();

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow + 1}`);
    const brandCell = this.worksheet.getCell(`A${this.currentRow}`);
    brandCell.value = 'VIADCA';
    brandCell.style = styles.brandHeaderStyle;
    this.worksheet.getRow(this.currentRow).height = 45;
    this.worksheet.getRow(this.currentRow + 1).height = 15;
    this.currentRow += 3;

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const timestampCell = this.worksheet.getCell(`A${this.currentRow}`);
    const now = new Date();
    timestampCell.value = `Documento generado: ${now.toLocaleDateString(
      'es-ES',
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    )} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    timestampCell.style = styles.timestampStyle;
    this.worksheet.getRow(this.currentRow).height = 20;
    this.currentRow += 2;
  }

  private addPackageTitle(packageName: string): void {
    const styles = this.getStyles();

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const titleCell = this.worksheet.getCell(`A${this.currentRow}`);
    titleCell.value = `${packageName.toUpperCase()}`;
    titleCell.style = styles.packageTitleStyle;
    this.worksheet.getRow(this.currentRow).height = 35;
    this.currentRow += 2;
  }

  private addModernSection(
    title: string,
    icon: string = '',
    color?: string,
  ): void {
    const styles = this.getStyles();
    const palette = PaqueteExcelTemplate.COLORS;
    const baseColor = color ?? palette.secondary;
    const iconColor = this.lightenColor(baseColor, 18);

    this.worksheet.getCell(`A${this.currentRow}`).value = icon;
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      ...styles.iconStyle,
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: iconColor },
      },
    };

    this.worksheet.mergeCells(`B${this.currentRow}:D${this.currentRow}`);
    const sectionCell = this.worksheet.getCell(`B${this.currentRow}`);
    sectionCell.value = title;
    sectionCell.style = {
      ...styles.sectionHeaderStyle,
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: baseColor },
      },
    };

    this.worksheet.getRow(this.currentRow).height = 30;
    this.currentRow++;
  }

  private addInfoCard(
    icon: string,
    label: string,
    value: string,
    isHighlight: boolean = false,
  ): void {
    const styles = this.getStyles();
    const palette = PaqueteExcelTemplate.COLORS;

    this.worksheet.getCell(`A${this.currentRow}`).value = '';
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      font: { name: 'Segoe UI', size: 12 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: palette.accent },
      },
      border: this.getSubtleBorders(),
    };

    this.worksheet.getCell(`B${this.currentRow}`).value = label;
    this.worksheet.getCell(`B${this.currentRow}`).style =
      styles.fieldLabelStyle;

    this.worksheet.mergeCells(`C${this.currentRow}:D${this.currentRow}`);
    this.worksheet.getCell(`C${this.currentRow}`).value =
      value || 'No especificado';
    this.worksheet.getCell(`C${this.currentRow}`).style = isHighlight
      ? styles.highlightStyle
      : styles.fieldValueStyle;

    this.worksheet.getRow(this.currentRow).height = Math.max(
      22,
      this.calculateRowHeight(value),
    );
    this.currentRow++;
  }

  private addInfoCardWithLink(
    icon: string,
    label: string,
    text: string,
    hyperlink: string,
  ): void {
    const styles = this.getStyles();
    const palette = PaqueteExcelTemplate.COLORS;

    this.worksheet.getCell(`A${this.currentRow}`).value = '';
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      font: { name: 'Segoe UI', size: 12 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: palette.accent },
      },
      border: this.getSubtleBorders(),
    };

    this.worksheet.getCell(`B${this.currentRow}`).value = label;
    this.worksheet.getCell(`B${this.currentRow}`).style =
      styles.fieldLabelStyle;

    this.worksheet.mergeCells(`C${this.currentRow}:D${this.currentRow}`);
    const linkCell = this.worksheet.getCell(`C${this.currentRow}`);
    linkCell.value = {
      text: text,
      hyperlink: hyperlink,
    };
    linkCell.style = {
      ...styles.fieldValueStyle,
      font: {
        name: 'Segoe UI',
        size: 11,
        color: { argb: palette.textDark },
        underline: true,
        bold: false,
      },
    };

    this.worksheet.getRow(this.currentRow).height = Math.max(
      22,
      this.calculateRowHeight(text),
    );
    this.currentRow++;
  }

  private addRichTextContent(content: string): void {
    const styles = this.getStyles();

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const textCell = this.worksheet.getCell(`A${this.currentRow}`);
    textCell.value = content;
    textCell.style = styles.longTextStyle;

    const rowHeight = this.calculateRowHeight(content, true);
    this.worksheet.getRow(this.currentRow).height = rowHeight;
    this.currentRow++;
  }

  private addModernTable(
    headers: string[],
    data: any[][],
    hasAlternatingRows: boolean = true,
  ): void {
    const styles = this.getStyles();

    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
      this.worksheet.getCell(`${colLetter}${this.currentRow}`).value = header;
      this.worksheet.getCell(`${colLetter}${this.currentRow}`).style =
        styles.tableHeaderStyle;
    });
    this.worksheet.getRow(this.currentRow).height = 28;
    this.currentRow++;

    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const colLetter = String.fromCharCode(65 + colIndex);
        this.worksheet.getCell(`${colLetter}${this.currentRow}`).value = cell;

        if (hasAlternatingRows) {
          this.worksheet.getCell(`${colLetter}${this.currentRow}`).style =
            rowIndex % 2 === 0
              ? styles.tableRowEvenStyle
              : styles.tableRowOddStyle;
        } else {
          this.worksheet.getCell(`${colLetter}${this.currentRow}`).style =
            styles.tableRowOddStyle;
        }
      });
      this.worksheet.getRow(this.currentRow).height = 25;
      this.currentRow++;
    });
  }

  private addStatusBadge(status: string): string {
    const statusMap: { [key: string]: string } = {
      activo: 'ACTIVO',
      inactivo: 'INACTIVO',
      borrador: 'BORRADOR',
      pendiente: 'PENDIENTE',
    };

    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = ((num >> 8) & 0x00ff) + amt;
    const B = (num & 0x0000ff) + amt;
    return (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1);
  }

  private calculateRowHeight(
    text: string,
    isLongText: boolean = false,
  ): number {
    if (!text) return 22;

    const baseHeight = 22;
    const charWidth = isLongText ? 100 : 60;
    const lines = Math.ceil(text.length / charWidth);

    return Math.max(baseHeight, Math.min(lines * 18, isLongText ? 200 : 120));
  }

  private addSectionSpacer(): void {
    this.currentRow += 1;
  }

  buildTemplate(
    paquete: Paquete,
    formattedData: any,
    clienteName?: string,
  ): void {
    this.addBrandHeader();

    this.addPackageTitle(paquete.titulo);

  this.addModernSection('INFORMACIÓN GENERAL');
    this.buildModernBasicInfo(formattedData.basicFields, paquete);

    if (paquete.destinos && paquete.destinos.length > 0) {
      this.buildModernDestinos(paquete.destinos.map(d => ({
        orden: d.orden,
        destino: [d.ciudad, d.estado, d.pais].filter(Boolean).join(', ')
      })));
    }

    if (paquete.hotel) {
      this.buildModernHotel(paquete.hotel);
    }

    if (paquete.mayoristas && paquete.mayoristas.length > 0) {
      this.buildModernMayoristas(paquete.mayoristas);
    }

    this.addModernFooter();

    this.createDetailsWorksheet(paquete, clienteName);
  }

  private buildModernBasicInfo(
    basicFields: Array<[string, string]>,
    paquete: Paquete,
  ): void {
    const iconMap: { [key: string]: string } = {
      Título: '',
      Precio: '',
      Duración: '',
      'Sitio Web': '',
      Origen: '',
      Fechas: '',
      Cliente: '',
    };

    const customFields: Array<
      [string, string | { text: string; hyperlink: string }]
    > = [
      ['Cliente', ''],
      ['Título', paquete.titulo],
      ['Precio Total', this.formatPrice(paquete.precio_total)],
  ['Precio Vuelo', this.formatPrice(paquete.precio_vuelo)],
  ['Precio Hospedaje', this.formatPrice(paquete.precio_hospedaje)],
      ['Descuento', this.formatPrice(paquete.descuento)],
      ['Anticipo', this.formatPrice(paquete.anticipo)],
      ['Duración', `${paquete.duracion_dias} días`],
      [
        'Sitio Web',
        {
          text: 'Ver paquete online',
          hyperlink: this.generateWebsiteUrl(paquete.codigoUrl),
        },
      ],
      ['Origen', paquete.origen],
      [
        'Fecha Inicio',
        paquete.fecha_inicio
          ? new Date(paquete.fecha_inicio).toLocaleDateString('es-ES')
          : 'No especificada',
      ],
      [
        'Fecha Fin',
        paquete.fecha_fin
          ? new Date(paquete.fecha_fin).toLocaleDateString('es-ES')
          : 'No especificada',
      ],
    ];

    customFields.forEach(([field, value]) => {
      const icon = '';

      const isHighlight = false;

      if (typeof value === 'object' && value.hyperlink) {
        this.addInfoCardWithLink('', field, value.text, value.hyperlink);
      } else {
        this.addInfoCard(
          '',
          field,
          (value as string) || (field === 'Cliente' ? '' : 'No especificado'),
          isHighlight,
        );
      }
    });

    this.addSectionSpacer();
  }

  private buildModernDestinos(destinos: any[]): void {
    this.addModernSection('DESTINOS DEL VIAJE');

    const tableData = destinos
      .sort((a, b) => a.orden - b.orden)
      .map((destino) => [destino.orden.toString(), destino.destino]);

    this.addModernTable(['Orden', 'Destino'], tableData);
    this.addSectionSpacer();
  }

  private buildModernHotel(hotel: any): void {
    this.addModernSection('ALOJAMIENTO');

    this.addInfoCard('', 'Nombre del Hotel', hotel.nombre);
    this.addInfoCard('', 'Calificación', this.getStarRating(hotel.estrellas));
    this.addInfoCard(
      '',
      'Total de Calificaciones',
      this.formatNumber(hotel.total_calificaciones),
    );

    this.addSectionSpacer();
  }

  private buildModernItinerario(itinerarios: any[]): void {
    this.addModernSection('ITINERARIO DETALLADO');

    itinerarios
      .sort((a, b) => a.dia_numero - b.dia_numero)
      .forEach((itinerario, index) => {
        this.addInfoCard(
          '',
          `Día ${itinerario.dia_numero}`,
          itinerario.descripcion,
        );
      });

    this.addSectionSpacer();
  }

  private buildModernMayoristas(mayoristas: any[]): void {
    this.addModernSection('MAYORISTAS ASOCIADOS');

    const tableData = mayoristas.map((mayorista) => [
      mayorista.nombre,
      mayorista.tipo_producto,
      mayorista.clave || 'N/A',
    ]);

    this.addModernTable(['Nombre', 'Tipo de Producto', 'Clave'], tableData);
    this.addSectionSpacer();
  }

  private addModernFooter(): void {
    this.currentRow += 2;

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const footerCell = this.worksheet.getCell(`A${this.currentRow}`);
    footerCell.value = '© 2025 Viadca';
    footerCell.style = {
      font: {
        name: 'Segoe UI',
        size: 9,
        italic: true,
        color: { argb: PaqueteExcelTemplate.COLORS.textMuted },
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    };
    this.worksheet.getRow(this.currentRow).height = 25;
  }

  private getStarRating(stars: number): string {
    if (!stars || stars === 0) return 'Sin calificación';
    return `${stars}/5 estrellas`;
  }

  private formatNumber(num: number | string): string {
    if (!num) return '0';
    const number = typeof num === 'string' ? parseInt(num) : num;
    return number.toLocaleString('es-ES');
  }

  private formatPriceBreakdown(paquete: Paquete): string {
    const parts: string[] = [];

    if (paquete.precio_total) {
      parts.push(`Total: $${paquete.precio_total.toLocaleString('es-ES')}`);
    }

    if (paquete.precio_vuelo && paquete.precio_vuelo > 0) {
      parts.push(`Vuelo: $${paquete.precio_vuelo.toLocaleString('es-ES')}`);
    }

    if (paquete.precio_hospedaje && paquete.precio_hospedaje > 0) {
      parts.push(
        `Hospedaje: $${paquete.precio_hospedaje.toLocaleString('es-ES')}`,
      );
    }

    if (paquete.descuento && paquete.descuento > 0) {
      parts.push(`Descuento: $${paquete.descuento.toLocaleString('es-ES')}`);
    }

    if (paquete.anticipo && paquete.anticipo > 0) {
      parts.push(`Anticipo: $${paquete.anticipo.toLocaleString('es-ES')}`);
    }

    return parts.join(', ');
  }

  private formatPrice(price: number | null): string {
    if (!price || price <= 0) return 'No especificado';
    return `$${price.toLocaleString('es-ES')}`;
  }

  private generateWebsiteUrl(codigoUrl: string): string {
    return `https://www.viadca.app/paquetes/${codigoUrl}`;
  }

  async generateBuffer(): Promise<Buffer> {
    this.worksheet.views = [
      {
        state: 'normal',
        showGridLines: false,
        showRowColHeaders: false,
        zoomScale: 100,
        rightToLeft: false,
      },
    ];

    // Habilitar o deshabilitar protección por variable de entorno (mejora compatibilidad macOS)
    const enableProtection = process.env.EXCEL_PROTECT !== 'false';
    if (enableProtection) {
      await this.worksheet.protect('viadca2025', {
        selectLockedCells: true,
        selectUnlockedCells: true,
        formatCells: false,
        formatColumns: false,
        formatRows: false,
        insertRows: false,
        insertColumns: false,
        insertHyperlinks: false,
        deleteRows: false,
        deleteColumns: false,
        sort: false,
        autoFilter: false,
        pivotTables: false,
      });
    }

    this.worksheet.pageSetup.margins = {
      left: 0.3,
      right: 0.3,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    };

    this.worksheet.pageSetup.printArea = `A1:D${this.currentRow + 5}`;
    this.worksheet.pageSetup.scale = 85;

    // Forzar recálculo al abrir y mejorar compatibilidad
    this.workbook.calcProperties.fullCalcOnLoad = true;

    const buffer = await this.workbook.xlsx.writeBuffer({
      useStyles: true,
      useSharedStrings: true,
    } as ExcelJS.stream.xlsx.WorkbookWriterOptions);
    return Buffer.from(buffer as ArrayBuffer);
  }

  private addCustomDataValidation(cellRef: string, options: string[]): void {
    this.worksheet.getCell(cellRef).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"' + options.join(',') + '"'],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: 'Por favor seleccione un valor de la lista.',
    };
  }

  private addConditionalFormatting(): void {
    const palette = PaqueteExcelTemplate.COLORS;

    this.worksheet.addConditionalFormatting({
      ref: 'C:C',
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: [1000],
          priority: 1,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: palette.subtle },
            },
            font: { bold: true, color: { argb: '000000' } },
          },
        },
      ],
    });

    this.worksheet.addConditionalFormatting({
      ref: 'C:C',
      rules: [
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'ACTIVO',
          priority: 2,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: palette.accent },
            },
            font: { bold: true, color: { argb: '000000' } },
          },
        },
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'INACTIVO',
          priority: 3,
          style: {
            fill: {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: palette.subtle },
            },
            font: { bold: true, color: { argb: '000000' } },
          },
        },
      ],
    });
  }

  private addSimpleChart(dataRange: string, title: string): void {
    const chartData = {
      title: title,
      dataRange: dataRange,
      type: 'column',
    };
  }

  async generatePDF(): Promise<Buffer> {
    return this.generateBuffer();
  }

  private validatePackageData(paquete: Paquete): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!paquete.titulo) errors.push('El título del paquete es requerido');
    if (!paquete.precio_total || paquete.precio_total <= 0)
      errors.push('El precio debe ser mayor a 0');
    if (!paquete.duracion_dias || paquete.duracion_dias <= 0)
      errors.push('La duración debe ser mayor a 0');

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static async createTemplate(
    paquete: Paquete,
    formattedData: any,
    clienteName?: string,
  ): Promise<
    | { template: PaqueteExcelTemplate; buffer: Buffer }
    | { error: string; errors: string[] }
  > {
    const template = new PaqueteExcelTemplate();

    const validation = template.validatePackageData(paquete);
    if (!validation.isValid) {
      return {
        error: 'Datos del paquete inválidos',
        errors: validation.errors,
      };
    }

    template.buildTemplate(paquete, formattedData, clienteName);

    template.addConditionalFormatting();

    const buffer = await template.generateBuffer();

    return { template, buffer };
  }

  private getColorsByCategory(categoria: string): {
    primary: string;
    secondary: string;
    accent: string;
  } {
    const palette = PaqueteExcelTemplate.COLORS;
    const colorSchemes: {
      [key: string]: { primary: string; secondary: string; accent: string };
    } = {
      playa: { primary: '74b9ff', secondary: '0984e3', accent: 'fd79a8' },
      montaña: { primary: '00b894', secondary: '00a085', accent: 'fdcb6e' },
      ciudad: { primary: '6c5ce7', secondary: '5f3dc4', accent: 'a29bfe' },
      aventura: { primary: 'e17055', secondary: 'd63031', accent: 'fab1a0' },
      cultural: { primary: 'fdcb6e', secondary: 'e84393', accent: 'fd79a8' },
      default: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
      },
    };

    return colorSchemes[categoria.toLowerCase()] || colorSchemes.default;
  }

  private addAdvancedMetadata(paquete: Paquete): void {
    this.workbook.title = `Paquete Turístico - ${paquete.titulo}`;
    this.workbook.subject = 'Información detallada del paquete turístico';
    this.workbook.keywords = `turismo,viaje,paquete,${paquete.titulo},viadca`;
    this.workbook.description = `Documento generado automáticamente con la información completa del paquete turístico ${paquete.titulo}`;
    this.workbook.manager = 'Sistema Viadca';
    this.workbook.company = 'Viadca';
  }

  private addClientInfo(clienteName: string): void {
    const styles = this.getStyles();
    const palette = PaqueteExcelTemplate.COLORS;

    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const clientCell = this.worksheet.getCell(`A${this.currentRow}`);
    clientCell.value = `Cliente: ${clienteName}`;
    clientCell.style = {
      font: {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: { argb: palette.textDark },
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: palette.accent },
      },
      alignment: {
        horizontal: 'center' as const,
        vertical: 'middle' as const,
      },
      border: this.getSubtleBorders(),
    };
    this.worksheet.getRow(this.currentRow).height = 30;
    this.currentRow += 2;
  }

  private createDetailsWorksheet(paquete: Paquete, clienteName?: string): void {
    const palette = PaqueteExcelTemplate.COLORS;
    const detailsWorksheet = this.workbook.addWorksheet(
      'Detalles del Paquete',
      {
        pageSetup: {
          paperSize: 9,
          orientation: 'portrait',
          margins: {
            left: 0.4,
            right: 0.4,
            top: 0.6,
            bottom: 0.6,
            header: 0.3,
            footer: 0.3,
          },
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
        },
      },
    );

    detailsWorksheet.columns = [{ key: 'content', width: 100 }];

    let currentDetailRow = 1;

    detailsWorksheet.mergeCells(`A${currentDetailRow}:A${currentDetailRow}`);
    const headerCell = detailsWorksheet.getCell(`A${currentDetailRow}`);
    headerCell.value = `VIADCA - DETALLES DEL PAQUETE`;
    headerCell.style = {
      font: {
        name: 'Segoe UI',
        size: 18,
        bold: true,
        color: { argb: palette.white },
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: palette.primary },
      },
      alignment: {
        horizontal: 'center' as const,
        vertical: 'middle' as const,
      },
    };
    detailsWorksheet.getRow(currentDetailRow).height = 40;
    currentDetailRow += 2;

    if (clienteName) {
      detailsWorksheet.getCell(`A${currentDetailRow}`).value =
        `Cliente: ${clienteName}`;
      detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
        font: {
          name: 'Segoe UI',
          size: 12,
          bold: true,
          color: { argb: palette.textDark },
        },
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: palette.accent },
        },
        alignment: {
          horizontal: 'center' as const,
          vertical: 'middle' as const,
        },
      };
      detailsWorksheet.getRow(currentDetailRow).height = 25;
      currentDetailRow += 2;
    }

    detailsWorksheet.getCell(`A${currentDetailRow}`).value =
      `Paquete: ${paquete.titulo}`;
    detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
      font: {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: { argb: palette.textDark },
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    };
    detailsWorksheet.getRow(currentDetailRow).height = 30;
    currentDetailRow += 3;

    if (paquete.incluye) {
      currentDetailRow = this.addDetailSection(
        detailsWorksheet,
        currentDetailRow,
        'QUÉ INCLUYE',
        paquete.incluye,
      );
    }

    if (paquete.no_incluye) {
      currentDetailRow = this.addDetailSection(
        detailsWorksheet,
        currentDetailRow,
        'QUÉ NO INCLUYE',
        paquete.no_incluye,
      );
    }

    if (paquete.requisitos) {
      currentDetailRow = this.addDetailSection(
        detailsWorksheet,
        currentDetailRow,
        'REQUISITOS',
        paquete.requisitos,
      );
    }

    if (paquete.notas) {
      currentDetailRow = this.addDetailSection(
        detailsWorksheet,
        currentDetailRow,
        'NOTAS IMPORTANTES',
        paquete.notas,
      );
    }

    if (paquete.itinerarios && paquete.itinerarios.length > 0) {
      currentDetailRow = this.addItinerarySection(
        detailsWorksheet,
        currentDetailRow,
        paquete.itinerarios,
      );
    }

    currentDetailRow += 2;
    detailsWorksheet.getCell(`A${currentDetailRow}`).value = '© 2025 Viadca';
    detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
      font: {
        name: 'Segoe UI',
        size: 9,
        italic: true,
        color: { argb: palette.textMuted },
      },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
    };
  }

  private addDetailSection(
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    title: string,
    content: string,
    color?: string,
  ): number {
    let currentRow = startRow;
    const palette = PaqueteExcelTemplate.COLORS;
    const headerColor = color ?? palette.secondary;
    const bodyFill = this.lightenColor(headerColor, 25);

    worksheet.getCell(`A${currentRow}`).value = title;
    worksheet.getCell(`A${currentRow}`).style = {
      font: {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: { argb: palette.white },
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: headerColor },
      },
      alignment: {
        horizontal: 'left' as const,
        vertical: 'middle' as const,
        indent: 1,
      },
    };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    worksheet.getCell(`A${currentRow}`).value = content;
    worksheet.getCell(`A${currentRow}`).style = {
      font: {
        name: 'Segoe UI',
        size: 11,
        color: { argb: palette.textDark },
      },
      alignment: {
        horizontal: 'justify' as const,
        vertical: 'top' as const,
        wrapText: true,
        indent: 1,
      },
      border: {
        top: { style: 'thin' as const, color: { argb: palette.border } },
        left: { style: 'thin' as const, color: { argb: palette.border } },
        bottom: { style: 'thin' as const, color: { argb: palette.border } },
        right: { style: 'thin' as const, color: { argb: palette.border } },
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: bodyFill },
      },
    };

    const rowHeight = Math.max(
      25,
      Math.min(Math.ceil(content.length / 110) * 18, 220),
    );
    worksheet.getRow(currentRow).height = rowHeight;
    currentRow += 3;

    return currentRow;
  }

  private addItinerarySection(
    worksheet: ExcelJS.Worksheet,
    startRow: number,
    itinerarios: any[],
  ): number {
    let currentRow = startRow;
    const palette = PaqueteExcelTemplate.COLORS;

    worksheet.getCell(`A${currentRow}`).value = 'ITINERARIO DETALLADO';
    worksheet.getCell(`A${currentRow}`).style = {
      font: {
        name: 'Segoe UI',
        size: 14,
        bold: true,
        color: { argb: palette.white },
      },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: palette.secondary },
      },
      alignment: {
        horizontal: 'left' as const,
        vertical: 'middle' as const,
        indent: 1,
      },
    };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    itinerarios
      .sort((a, b) => a.dia_numero - b.dia_numero)
      .forEach((itinerario) => {
        const dayCell = worksheet.getCell(`A${currentRow}`);
        dayCell.value = `Día ${itinerario.dia_numero}`;
        dayCell.style = {
          font: {
            name: 'Segoe UI',
            size: 12,
            bold: true,
            color: { argb: palette.textDark },
          },
          fill: {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: palette.accent },
          },
          alignment: {
            horizontal: 'left' as const,
            vertical: 'middle' as const,
            indent: 1,
          },
          border: this.getSubtleBorders(),
        };
        worksheet.getRow(currentRow).height = 25;
        currentRow++;

        const detailCell = worksheet.getCell(`A${currentRow}`);
        detailCell.value = itinerario.descripcion;
        detailCell.style = {
          font: {
            name: 'Segoe UI',
            size: 11,
            color: { argb: palette.textDark },
          },
          alignment: {
            horizontal: 'justify' as const,
            vertical: 'top' as const,
            wrapText: true,
            indent: 2,
          },
          fill: {
            type: 'pattern' as const,
            pattern: 'solid' as const,
            fgColor: { argb: palette.subtle },
          },
          border: {
            left: { style: 'thin' as const, color: { argb: palette.border } },
            bottom: { style: 'thin' as const, color: { argb: palette.border } },
          },
        };

        const rowHeight = Math.max(
          20,
          Math.min(Math.ceil(itinerario.descripcion.length / 110) * 18, 180),
        );
        worksheet.getRow(currentRow).height = rowHeight;
        currentRow += 2;
      });

    return currentRow;
  }
}
