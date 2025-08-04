import * as ExcelJS from 'exceljs';
import { Paquete } from '../../paquetes/entidades/paquete.entity';

export class PaqueteExcelTemplate {
  private workbook: ExcelJS.Workbook;
  private worksheet: ExcelJS.Worksheet;
  private currentRow: number = 1;

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
          left: 0.4, right: 0.4,
          top: 0.6, bottom: 0.6,
          header: 0.3, footer: 0.3
        },
        printArea: 'A1:D120',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // Configuración de columnas optimizada para diseño moderno
    this.worksheet.columns = [
      { key: 'icon', width: 6 },        // Columna para iconos
      { key: 'campo', width: 26 },      // Campo/etiqueta
      { key: 'valor', width: 50 },      // Contenido principal
      { key: 'extra', width: 18 }       // Información adicional/acciones
    ];
  }

  private getStyles() {
    return {
      // Diseño del header principal - Color sólido
      brandHeaderStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 24, 
          bold: true, 
          color: { argb: 'FFFFFF' } 
        },
        fill: { 
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: '667eea' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const 
        },
        border: {
          bottom: { style: 'thick' as const, color: { argb: '667eea' } }
        }
      },

      // Estilo para el título del paquete
      packageTitleStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 20, 
          bold: true, 
          color: { argb: '2c3e50' } 
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'f8f9fa' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const 
        },
        border: {
          top: { style: 'thin' as const, color: { argb: 'e9ecef' } },
          bottom: { style: 'thin' as const, color: { argb: 'e9ecef' } },
          left: { style: 'thin' as const, color: { argb: 'e9ecef' } },
          right: { style: 'thin' as const, color: { argb: 'e9ecef' } }
        }
      },

      // Secciones principales con diseño moderno
      sectionHeaderStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 14, 
          bold: true, 
          color: { argb: 'FFFFFF' } 
        },
        fill: { 
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: '4facfe' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'middle' as const,
          indent: 2
        },
        border: this.getModernBorders()
      },

      // Iconos para secciones
      iconStyle: {
        font: { 
          name: 'Segoe UI Emoji', 
          size: 16, 
          bold: true 
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'ffffff' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const 
        },
        border: this.getModernBorders()
      },

      // Campos de información - Diseño card
      fieldLabelStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 11, 
          bold: true,
          color: { argb: '000000' }
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'f8f9fa' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'middle' as const,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      // Valores - Más legible y moderno
      fieldValueStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 11,
          color: { argb: '000000' },
          bold: false
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'ffffff' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'top' as const, 
          wrapText: true,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      // Texto largo con mejor formato
      longTextStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 10,
          color: { argb: '000000' },
          bold: false
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'fdfdfe' }
        },
        alignment: { 
          horizontal: 'justify' as const, 
          vertical: 'top' as const, 
          wrapText: true,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      // Elementos destacados - Precio, fechas importantes
      highlightStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 11, 
          bold: false,
          color: { argb: '000000' }
        },
        fill: { 
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'ffffff' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'top' as const, 
          wrapText: true,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      // Headers de tabla mejorados
      tableHeaderStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 11, 
          bold: true,
          color: { argb: 'FFFFFF' }
        },
        fill: { 
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: '6c5ce7' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        },
        border: this.getModernBorders()
      },

      // Filas alternadas en tablas
      tableRowEvenStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 10,
          color: { argb: '000000' },
          bold: false
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'f8f9fa' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'middle' as const,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      tableRowOddStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 10,
          color: { argb: '000000' },
          bold: false
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'ffffff' }
        },
        alignment: { 
          horizontal: 'left' as const, 
          vertical: 'middle' as const,
          indent: 1
        },
        border: this.getSubtleBorders()
      },

      // Badges para estados
      badgeSuccessStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 10, 
          bold: true,
          color: { argb: 'FFFFFF' }
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: '00b894' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        },
        border: this.getRoundedBorders()
      },

      badgeWarningStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 10, 
          bold: true,
          color: { argb: 'FFFFFF' }
        },
        fill: { 
          type: 'pattern' as const, 
          pattern: 'solid' as const, 
          fgColor: { argb: 'fdcb6e' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        },
        border: this.getRoundedBorders()
      },

      // Fechas y timestamps
      timestampStyle: {
        font: { 
          name: 'Segoe UI', 
          size: 9, 
          italic: true,
          color: { argb: '74b9ff' }
        },
        alignment: { 
          horizontal: 'center' as const, 
          vertical: 'middle' as const
        }
      }
    };
  }

  private getModernBorders() {
    return {
      top: { style: 'medium' as const, color: { argb: 'e9ecef' } },
      left: { style: 'medium' as const, color: { argb: 'e9ecef' } },
      bottom: { style: 'medium' as const, color: { argb: 'e9ecef' } },
      right: { style: 'medium' as const, color: { argb: 'e9ecef' } }
    };
  }

  private getSubtleBorders() {
    return {
      top: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
      left: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
      bottom: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
      right: { style: 'thin' as const, color: { argb: 'f1f3f4' } }
    };
  }

  private getRoundedBorders() {
    return {
      top: { style: 'thick' as const, color: { argb: 'ffffff' } },
      left: { style: 'thick' as const, color: { argb: 'ffffff' } },
      bottom: { style: 'thick' as const, color: { argb: 'ffffff' } },
      right: { style: 'thick' as const, color: { argb: 'ffffff' } }
    };
  }

  private addBrandHeader(): void {
    const styles = this.getStyles();
    
    // Header principal con branding moderno
    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow + 1}`);
    const brandCell = this.worksheet.getCell(`A${this.currentRow}`);
    brandCell.value = 'VIADCA';
    brandCell.style = styles.brandHeaderStyle;
    this.worksheet.getRow(this.currentRow).height = 45;
    this.worksheet.getRow(this.currentRow + 1).height = 15;
    this.currentRow += 3;

    // Timestamp elegante
    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const timestampCell = this.worksheet.getCell(`A${this.currentRow}`);
    const now = new Date();
    timestampCell.value = `Documento generado: ${now.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    })} a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
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

  private addModernSection(title: string, icon: string, color: string = '4facfe'): void {
    const styles = this.getStyles();
    
    // Icono
    this.worksheet.getCell(`A${this.currentRow}`).value = icon;
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      ...styles.iconStyle,
      fill: { 
        type: 'pattern' as const, 
        pattern: 'solid' as const, 
        fgColor: { argb: color }
      }
    };
    
    // Título de sección con gradiente personalizado
    this.worksheet.mergeCells(`B${this.currentRow}:D${this.currentRow}`);
    const sectionCell = this.worksheet.getCell(`B${this.currentRow}`);
    sectionCell.value = title;
    sectionCell.style = {
      ...styles.sectionHeaderStyle,
      fill: { 
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: color }
      }
    };
    
    this.worksheet.getRow(this.currentRow).height = 30;
    this.currentRow++;
  }

  private addInfoCard(icon: string, label: string, value: string, isHighlight: boolean = false): void {
    const styles = this.getStyles();
    
    // Icono pequeño (vacío ahora)
    this.worksheet.getCell(`A${this.currentRow}`).value = '';
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      font: { name: 'Segoe UI', size: 12 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'f8f9fa' } },
      border: this.getSubtleBorders()
    };
    
    // Label
    this.worksheet.getCell(`B${this.currentRow}`).value = label;
    this.worksheet.getCell(`B${this.currentRow}`).style = styles.fieldLabelStyle;
    
    // Valor con estilo condicional
    this.worksheet.mergeCells(`C${this.currentRow}:D${this.currentRow}`);
    this.worksheet.getCell(`C${this.currentRow}`).value = value || 'No especificado';
    this.worksheet.getCell(`C${this.currentRow}`).style = isHighlight ? 
      styles.highlightStyle : styles.fieldValueStyle;
    
    this.worksheet.getRow(this.currentRow).height = Math.max(22, this.calculateRowHeight(value));
    this.currentRow++;
  }

  private addInfoCardWithLink(icon: string, label: string, text: string, hyperlink: string): void {
    const styles = this.getStyles();
    
    // Icono pequeño (vacío ahora)
    this.worksheet.getCell(`A${this.currentRow}`).value = '';
    this.worksheet.getCell(`A${this.currentRow}`).style = {
      font: { name: 'Segoe UI', size: 12 },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'f8f9fa' } },
      border: this.getSubtleBorders()
    };
    
    // Label
    this.worksheet.getCell(`B${this.currentRow}`).value = label;
    this.worksheet.getCell(`B${this.currentRow}`).style = styles.fieldLabelStyle;
    
    // Valor con hipervínculo
    this.worksheet.mergeCells(`C${this.currentRow}:D${this.currentRow}`);
    const linkCell = this.worksheet.getCell(`C${this.currentRow}`);
    linkCell.value = {
      text: text,
      hyperlink: hyperlink
    };
    linkCell.style = {
      ...styles.fieldValueStyle,
      font: { 
        name: 'Segoe UI',
        size: 11,
        color: { argb: '000000' },
        underline: true,
        bold: false
      }
    };
    
    this.worksheet.getRow(this.currentRow).height = Math.max(22, this.calculateRowHeight(text));
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

  private addModernTable(headers: string[], data: any[][], hasAlternatingRows: boolean = true): void {
    const styles = this.getStyles();
    
    // Headers
    headers.forEach((header, index) => {
      const colLetter = String.fromCharCode(65 + index);
      this.worksheet.getCell(`${colLetter}${this.currentRow}`).value = header;
      this.worksheet.getCell(`${colLetter}${this.currentRow}`).style = styles.tableHeaderStyle;
    });
    this.worksheet.getRow(this.currentRow).height = 28;
    this.currentRow++;
    
    // Data rows con alternancia
    data.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        const colLetter = String.fromCharCode(65 + colIndex);
        this.worksheet.getCell(`${colLetter}${this.currentRow}`).value = cell;
        
        if (hasAlternatingRows) {
          this.worksheet.getCell(`${colLetter}${this.currentRow}`).style = 
            rowIndex % 2 === 0 ? styles.tableRowEvenStyle : styles.tableRowOddStyle;
        } else {
          this.worksheet.getCell(`${colLetter}${this.currentRow}`).style = styles.tableRowOddStyle;
        }
      });
      this.worksheet.getRow(this.currentRow).height = 25;
      this.currentRow++;
    });
  }

  private addStatusBadge(status: string): string {
    const statusMap: { [key: string]: string } = {
      'activo': 'ACTIVO',
      'inactivo': 'INACTIVO',
      'borrador': 'BORRADOR',
      'pendiente': 'PENDIENTE'
    };
    
    return statusMap[status.toLowerCase()] || status.toUpperCase();
  }

  private lightenColor(color: string, percent: number): string {
    // Función para aclarar colores hex
    const num = parseInt(color, 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  private calculateRowHeight(text: string, isLongText: boolean = false): number {
    if (!text) return 22;
    
    const baseHeight = 22;
    const charWidth = isLongText ? 120 : 90;
    const lines = Math.ceil(text.length / charWidth);
    
    return Math.max(baseHeight, Math.min(lines * 16, isLongText ? 180 : 70));
  }

  private addSectionSpacer(): void {
    this.currentRow += 1;
  }

  // Método principal mejorado
  buildTemplate(paquete: Paquete, formattedData: any, clienteName?: string): void {
    // Header moderno
    this.addBrandHeader();
    
    // Título del paquete
    this.addPackageTitle(paquete.titulo);

    // Información básica con cards modernas
    this.addModernSection('INFORMACIÓN GENERAL', '', '667eea');
    this.buildModernBasicInfo(formattedData.basicFields, paquete);

    // Destinos
    if (paquete.destinos && paquete.destinos.length > 0) {
      this.buildModernDestinos(paquete.destinos);
    }

    // Hotel
    if (paquete.hotel) {
      this.buildModernHotel(paquete.hotel);
    }

    // Mayoristas
    if (paquete.mayoristas && paquete.mayoristas.length > 0) {
      this.buildModernMayoristas(paquete.mayoristas);
    }

    // Footer elegante
    this.addModernFooter();

    // Crear segunda hoja con detalles adicionales
    this.createDetailsWorksheet(paquete, clienteName);
  }

  private buildModernBasicInfo(basicFields: Array<[string, string]>, paquete: Paquete): void {
    const iconMap: { [key: string]: string } = {
      'Título': '',
      'Precio': '',
      'Duración': '',
      'Sitio Web': '',
      'Origen': '',
      'Fechas': '',
      'Cliente': ''
    };

    // Campos personalizados con la información filtrada
    const customFields: Array<[string, string | { text: string; hyperlink: string }]> = [
      ['Cliente', ''], // Campo vacío para llenar manualmente
      ['Título', paquete.titulo],
      ['Precio Total', this.formatPrice(paquete.precio_total)],
      ['Descuento', this.formatPrice(paquete.descuento)],
      ['Anticipo', this.formatPrice(paquete.anticipo)],
      ['Duración', `${paquete.duracion_dias} días`],
      ['Sitio Web', { text: 'Ver paquete online', hyperlink: this.generateWebsiteUrl(paquete.codigoUrl) }],
      ['Origen', paquete.origen],
      ['Fecha Inicio', paquete.fecha_inicio ? new Date(paquete.fecha_inicio).toLocaleDateString('es-ES') : 'No especificada'],
      ['Fecha Fin', paquete.fecha_fin ? new Date(paquete.fecha_fin).toLocaleDateString('es-ES') : 'No especificada'],
    ];

    customFields.forEach(([field, value]) => {
      const icon = '';
      // Quitamos el highlighting especial para que todos los campos se vean igual
      const isHighlight = false;
      
      if (typeof value === 'object' && value.hyperlink) {
        // Para hipervínculos
        this.addInfoCardWithLink('', field, value.text, value.hyperlink);
      } else {
        // Para campos normales
        this.addInfoCard('', field, (value as string) || (field === 'Cliente' ? '' : 'No especificado'), isHighlight);
      }
    });
    
    this.addSectionSpacer();
  }

  private buildModernDestinos(destinos: any[]): void {
    this.addModernSection('DESTINOS DEL VIAJE', '', '74b9ff');
    
    const tableData = destinos
      .sort((a, b) => a.orden - b.orden)
      .map(destino => [
        destino.orden.toString(),
        destino.destino
      ]);
    
    this.addModernTable(['Orden', 'Destino'], tableData);
    this.addSectionSpacer();
  }

  private buildModernHotel(hotel: any): void {
    this.addModernSection('ALOJAMIENTO', '', 'fd79a8');
    
    this.addInfoCard('', 'Nombre del Hotel', hotel.nombre);
    this.addInfoCard('', 'Calificación', this.getStarRating(hotel.estrellas));
    this.addInfoCard('', 'Total de Calificaciones', this.formatNumber(hotel.total_calificaciones));
    
    this.addSectionSpacer();
  }

  private buildModernItinerario(itinerarios: any[]): void {
    this.addModernSection('ITINERARIO DETALLADO', '', '81ecec');
    
    itinerarios
      .sort((a, b) => a.dia_numero - b.dia_numero)
      .forEach((itinerario, index) => {
        this.addInfoCard(
          '', 
          `Día ${itinerario.dia_numero}`, 
          itinerario.descripcion
        );
      });
    
    this.addSectionSpacer();
  }

  private buildModernMayoristas(mayoristas: any[]): void {
    this.addModernSection('MAYORISTAS ASOCIADOS', '', 'fab1a0');
    
    const tableData = mayoristas.map(mayorista => [
      mayorista.nombre,
      mayorista.tipo_producto,
      mayorista.clave || 'N/A'
    ]);
    
    this.addModernTable(['Nombre', 'Tipo de Producto', 'Clave'], tableData);
    this.addSectionSpacer();
  }

  private addModernFooter(): void {
    this.currentRow += 2;
    
    // Footer con información de contacto
    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const footerCell = this.worksheet.getCell(`A${this.currentRow}`);
    footerCell.value = '© 2025 Viadca';
    footerCell.style = {
      font: { name: 'Segoe UI', size: 9, italic: true, color: { argb: '6c757d' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    };
    this.worksheet.getRow(this.currentRow).height = 25;
  }

  // Métodos auxiliares mejorados
  private getStarRating(stars: number): string {
    if (!stars || stars === 0) return 'Sin calificación';
    return `${stars}/5 estrellas`;
  }

  private formatNumber(num: number | string): string {
    if (!num) return '0';
    const number = typeof num === 'string' ? parseInt(num) : num;
    return number.toLocaleString('es-ES');
  }

  // Método para formatear precio con descuento y anticipo
  private formatPriceBreakdown(paquete: Paquete): string {
    const parts: string[] = [];
    
    if (paquete.precio_total) {
      parts.push(`Total: $${paquete.precio_total.toLocaleString('es-ES')}`);
    }
    
    if (paquete.descuento && paquete.descuento > 0) {
      parts.push(`Descuento: $${paquete.descuento.toLocaleString('es-ES')}`);
    }
    
    if (paquete.anticipo && paquete.anticipo > 0) {
      parts.push(`Anticipo: $${paquete.anticipo.toLocaleString('es-ES')}`);
    }
    
    return parts.join(', ');
  }

  // Método para formatear precio individual
  private formatPrice(price: number | null): string {
    if (!price || price <= 0) return 'No especificado';
    return `$${price.toLocaleString('es-ES')}`;
  }

  // Método para generar URL del sitio web
  private generateWebsiteUrl(codigoUrl: string): string {
    return `https://www.viadca.app/paquetes/${codigoUrl}`;
  }

  async generateBuffer(): Promise<Buffer> {
    // Configuraciones finales para optimización
    this.worksheet.views = [
      { 
        state: 'normal',
        showGridLines: false,
        showRowColHeaders: false,
        zoomScale: 100,
        rightToLeft: false
      }
    ];

    // Configurar protección del documento
    await this.worksheet.protect('viadca2024', {
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
      pivotTables: false
    });

    // Aplicar zoom y configuraciones de vista
    this.worksheet.pageSetup.margins = {
      left: 0.3, right: 0.3,
      top: 0.5, bottom: 0.5,
      header: 0.2, footer: 0.2
    };

    // Configurar impresión optimizada
    this.worksheet.pageSetup.printArea = `A1:D${this.currentRow + 5}`;
    this.worksheet.pageSetup.scale = 85; // Escala para mejor visualización

    const buffer = await this.workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Métodos adicionales para personalización avanzada
  private addCustomDataValidation(cellRef: string, options: string[]): void {
    this.worksheet.getCell(cellRef).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: ['"' + options.join(',') + '"'],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: 'Por favor seleccione un valor de la lista.'
    };
  }

  private addConditionalFormatting(): void {
    // Formateo condicional para precios
    this.worksheet.addConditionalFormatting({
      ref: 'C:C',
      rules: [
        {
          type: 'cellIs',
          operator: 'greaterThan',
          formulae: [1000],
          priority: 1,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'c7f2c7' } },
            font: { bold: true, color: { argb: '27ae60' } }
          }
        }
      ]
    });

    // Formateo para estados
    this.worksheet.addConditionalFormatting({
      ref: 'C:C',
      rules: [
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'ACTIVO',
          priority: 2,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'd4edda' } },
            font: { bold: true, color: { argb: '155724' } }
          }
        },
        {
          type: 'containsText',
          operator: 'containsText', 
          text: 'INACTIVO',
          priority: 3,
          style: {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'f8d7da' } },
            font: { bold: true, color: { argb: '721c24' } }
          }
        }
      ]
    });
  }

  // Método para agregar gráficos simples (si se necesita)
  private addSimpleChart(dataRange: string, title: string): void {
    // Nota: ExcelJS tiene limitaciones con gráficos, pero se puede preparar la estructura
    const chartData = {
      title: title,
      dataRange: dataRange,
      type: 'column' // o 'pie', 'line', etc.
    };
    
    // Esta funcionalidad requeriría una librería adicional como xlsx-populate
    // o generar el gráfico en el frontend
  }

  // Método para exportar a diferentes formatos
  async generatePDF(): Promise<Buffer> {
    // Esta funcionalidad requeriría puppeteer o similar
    // Por ahora retornamos el Excel que se puede convertir manualmente
    return this.generateBuffer();
  }

  // Método para validar datos antes de generar
  private validatePackageData(paquete: Paquete): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!paquete.titulo) errors.push('El título del paquete es requerido');
    if (!paquete.precio_total || paquete.precio_total <= 0) errors.push('El precio debe ser mayor a 0');
    if (!paquete.duracion_dias || paquete.duracion_dias <= 0) errors.push('La duración debe ser mayor a 0');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Método estático para crear instancia con validación
  static async createTemplate(paquete: Paquete, formattedData: any, clienteName?: string): Promise<{ template: PaqueteExcelTemplate; buffer: Buffer } | { error: string; errors: string[] }> {
    const template = new PaqueteExcelTemplate();
    
    // Validar datos
    const validation = template.validatePackageData(paquete);
    if (!validation.isValid) {
      return {
        error: 'Datos del paquete inválidos',
        errors: validation.errors
      };
    }

    // Construir template
    template.buildTemplate(paquete, formattedData, clienteName);
    
    // Aplicar formateo condicional
    template.addConditionalFormatting();
    
    // Generar buffer
    const buffer = await template.generateBuffer();
    
    return { template, buffer };
  }

  // Método para personalizar colores por categoría
  private getColorsByCategory(categoria: string): { primary: string; secondary: string; accent: string } {
    const colorSchemes: { [key: string]: { primary: string; secondary: string; accent: string } } = {
      'playa': { primary: '74b9ff', secondary: '0984e3', accent: 'fd79a8' },
      'montaña': { primary: '00b894', secondary: '00a085', accent: 'fdcb6e' },
      'ciudad': { primary: '6c5ce7', secondary: '5f3dc4', accent: 'a29bfe' },
      'aventura': { primary: 'e17055', secondary: 'd63031', accent: 'fab1a0' },
      'cultural': { primary: 'fdcb6e', secondary: 'e84393', accent: 'fd79a8' },
      'default': { primary: '667eea', secondary: '764ba2', accent: '4facfe' }
    };

    return colorSchemes[categoria.toLowerCase()] || colorSchemes.default;
  }

  // Método para agregar metadatos avanzados
  private addAdvancedMetadata(paquete: Paquete): void {
    this.workbook.title = `Paquete Turístico - ${paquete.titulo}`;
    this.workbook.subject = 'Información detallada del paquete turístico';
    this.workbook.keywords = `turismo,viaje,paquete,${paquete.titulo},viadca`;
    this.workbook.description = `Documento generado automáticamente con la información completa del paquete turístico ${paquete.titulo}`;
    this.workbook.manager = 'Sistema Viadca';
    this.workbook.company = 'Viadca';
  }

  // Método para agregar información del cliente
  private addClientInfo(clienteName: string): void {
    const styles = this.getStyles();
    
    this.worksheet.mergeCells(`A${this.currentRow}:D${this.currentRow}`);
    const clientCell = this.worksheet.getCell(`A${this.currentRow}`);
    clientCell.value = `Cliente: ${clienteName}`;
    clientCell.style = {
      font: { 
        name: 'Segoe UI', 
        size: 14, 
        bold: true, 
        color: { argb: '2c3e50' } 
      },
      fill: { 
        type: 'pattern' as const, 
        pattern: 'solid' as const, 
        fgColor: { argb: 'e3f2fd' }
      },
      alignment: { 
        horizontal: 'center' as const, 
        vertical: 'middle' as const 
      },
      border: this.getSubtleBorders()
    };
    this.worksheet.getRow(this.currentRow).height = 30;
    this.currentRow += 2;
  }

  // Método para crear hoja de detalles adicionales
  private createDetailsWorksheet(paquete: Paquete, clienteName?: string): void {
    const detailsWorksheet = this.workbook.addWorksheet('Detalles del Paquete', {
      pageSetup: { 
        paperSize: 9, 
        orientation: 'portrait',
        margins: {
          left: 0.4, right: 0.4,
          top: 0.6, bottom: 0.6,
          header: 0.3, footer: 0.3
        },
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0
      }
    });

    // Configuración de columnas para la segunda hoja
    detailsWorksheet.columns = [
      { key: 'content', width: 100 }
    ];

    let currentDetailRow = 1;

    // Header para la segunda hoja
    detailsWorksheet.mergeCells(`A${currentDetailRow}:A${currentDetailRow}`);
    const headerCell = detailsWorksheet.getCell(`A${currentDetailRow}`);
    headerCell.value = `VIADCA - DETALLES DEL PAQUETE`;
    headerCell.style = {
      font: { 
        name: 'Segoe UI', 
        size: 18, 
        bold: true, 
        color: { argb: 'FFFFFF' } 
      },
      fill: { 
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: '667eea' }
      },
      alignment: { 
        horizontal: 'center' as const, 
        vertical: 'middle' as const 
      }
    };
    detailsWorksheet.getRow(currentDetailRow).height = 40;
    currentDetailRow += 2;

    // Cliente info si existe
    if (clienteName) {
      detailsWorksheet.getCell(`A${currentDetailRow}`).value = `Cliente: ${clienteName}`;
      detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
        font: { name: 'Segoe UI', size: 12, bold: true, color: { argb: '2c3e50' } },
        fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'e3f2fd' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
      };
      detailsWorksheet.getRow(currentDetailRow).height = 25;
      currentDetailRow += 2;
    }

    // Paquete título
    detailsWorksheet.getCell(`A${currentDetailRow}`).value = `Paquete: ${paquete.titulo}`;
    detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
      font: { name: 'Segoe UI', size: 14, bold: true, color: { argb: '2c3e50' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    };
    detailsWorksheet.getRow(currentDetailRow).height = 30;
    currentDetailRow += 3;

    // Agregar secciones detalladas
    if (paquete.incluye) {
      currentDetailRow = this.addDetailSection(detailsWorksheet, currentDetailRow, 'QUÉ INCLUYE', paquete.incluye, '00b894');
    }

    if (paquete.no_incluye) {
      currentDetailRow = this.addDetailSection(detailsWorksheet, currentDetailRow, 'QUÉ NO INCLUYE', paquete.no_incluye, 'e17055');
    }

    if (paquete.requisitos) {
      currentDetailRow = this.addDetailSection(detailsWorksheet, currentDetailRow, 'REQUISITOS', paquete.requisitos, 'fdcb6e');
    }

    if (paquete.notas) {
      currentDetailRow = this.addDetailSection(detailsWorksheet, currentDetailRow, 'NOTAS IMPORTANTES', paquete.notas, 'a29bfe');
    }

    // Itinerario
    if (paquete.itinerarios && paquete.itinerarios.length > 0) {
      currentDetailRow = this.addItinerarySection(detailsWorksheet, currentDetailRow, paquete.itinerarios);
    }

    // Footer
    currentDetailRow += 2;
    detailsWorksheet.getCell(`A${currentDetailRow}`).value = '© 2025 Viadca';
    detailsWorksheet.getCell(`A${currentDetailRow}`).style = {
      font: { name: 'Segoe UI', size: 9, italic: true, color: { argb: '6c757d' } },
      alignment: { horizontal: 'center' as const, vertical: 'middle' as const }
    };
  }

  // Método auxiliar para agregar secciones de detalle
  private addDetailSection(worksheet: ExcelJS.Worksheet, startRow: number, title: string, content: string, color: string): number {
    let currentRow = startRow;

    // Título de la sección
    worksheet.getCell(`A${currentRow}`).value = title;
    worksheet.getCell(`A${currentRow}`).style = {
      font: { 
        name: 'Segoe UI', 
        size: 14, 
        bold: true, 
        color: { argb: 'FFFFFF' } 
      },
      fill: { 
        type: 'pattern' as const, 
        pattern: 'solid' as const, 
        fgColor: { argb: color }
      },
      alignment: { 
        horizontal: 'left' as const, 
        vertical: 'middle' as const,
        indent: 1
      }
    };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    // Contenido
    worksheet.getCell(`A${currentRow}`).value = content;
    worksheet.getCell(`A${currentRow}`).style = {
      font: { 
        name: 'Segoe UI', 
        size: 11,
        color: { argb: '000000' }
      },
      alignment: { 
        horizontal: 'justify' as const, 
        vertical: 'top' as const, 
        wrapText: true,
        indent: 1
      },
      border: {
        top: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
        left: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
        bottom: { style: 'thin' as const, color: { argb: 'f1f3f4' } },
        right: { style: 'thin' as const, color: { argb: 'f1f3f4' } }
      }
    };
    
    // Calcular altura basada en contenido
    const rowHeight = Math.max(25, Math.min(Math.ceil(content.length / 120) * 16, 200));
    worksheet.getRow(currentRow).height = rowHeight;
    currentRow += 3;

    return currentRow;
  }

  // Método auxiliar para agregar itinerario detallado
  private addItinerarySection(worksheet: ExcelJS.Worksheet, startRow: number, itinerarios: any[]): number {
    let currentRow = startRow;

    // Título de la sección
    worksheet.getCell(`A${currentRow}`).value = 'ITINERARIO DETALLADO';
    worksheet.getCell(`A${currentRow}`).style = {
      font: { 
        name: 'Segoe UI', 
        size: 14, 
        bold: true, 
        color: { argb: 'FFFFFF' } 
      },
      fill: { 
        type: 'pattern' as const, 
        pattern: 'solid' as const, 
        fgColor: { argb: '81ecec' }
      },
      alignment: { 
        horizontal: 'left' as const, 
        vertical: 'middle' as const,
        indent: 1
      }
    };
    worksheet.getRow(currentRow).height = 30;
    currentRow++;

    // Agregar cada día del itinerario
    itinerarios
      .sort((a, b) => a.dia_numero - b.dia_numero)
      .forEach((itinerario, index) => {
        // Día
        worksheet.getCell(`A${currentRow}`).value = `Día ${itinerario.dia_numero}`;
        worksheet.getCell(`A${currentRow}`).style = {
          font: { 
            name: 'Segoe UI', 
            size: 12, 
            bold: true,
            color: { argb: '2c3e50' }
          },
          fill: { 
            type: 'pattern' as const, 
            pattern: 'solid' as const, 
            fgColor: { argb: 'f8f9fa' }
          },
          alignment: { 
            horizontal: 'left' as const, 
            vertical: 'middle' as const,
            indent: 1
          }
        };
        worksheet.getRow(currentRow).height = 25;
        currentRow++;

        // Descripción
        worksheet.getCell(`A${currentRow}`).value = itinerario.descripcion;
        worksheet.getCell(`A${currentRow}`).style = {
          font: { 
            name: 'Segoe UI', 
            size: 11,
            color: { argb: '000000' }
          },
          alignment: { 
            horizontal: 'justify' as const, 
            vertical: 'top' as const, 
            wrapText: true,
            indent: 2
          },
          border: {
            left: { style: 'thin' as const, color: { argb: 'dee2e6' } },
            bottom: { style: 'thin' as const, color: { argb: 'f1f3f4' } }
          }
        };
        
        const rowHeight = Math.max(20, Math.min(Math.ceil(itinerario.descripcion.length / 120) * 16, 150));
        worksheet.getRow(currentRow).height = rowHeight;
        currentRow += 2;
      });

    return currentRow;
  }
}