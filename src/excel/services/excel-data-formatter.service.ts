import { Injectable } from '@nestjs/common';
import { Paquete } from '../../paquetes/entidades/paquete.entity';
import { EXCEL_TEMPLATE_CONFIG } from '../config/template.config';

@Injectable()
export class ExcelDataFormatterService {
  private config = EXCEL_TEMPLATE_CONFIG;
  
  // Helper function para formatear fechas
  formatDate(date: any): string {
    if (!date) return this.config.texts.labels.notSpecified;
    const dateObj = date instanceof Date ? date : new Date(date);
    return isNaN(dateObj.getTime()) ? this.config.texts.labels.invalidDate : dateObj.toLocaleDateString(this.config.formatting.locale);
  }

  // Helper function para formatear números de precio
  formatPrice(price: number | null | undefined): string {
    if (!price && price !== 0) return this.config.texts.labels.notSpecified;
    return `${this.config.formatting.currency.symbol}${price.toLocaleString(this.config.formatting.locale, { 
      minimumFractionDigits: this.config.formatting.currency.minimumFractionDigits 
    })}`;
  }

  // Formatear información básica del paquete
  formatBasicInfo(paquete: Paquete): Array<[string, string]> {
    return [
      // Removido el campo "Código URL" según los requerimientos
      [this.config.texts.labels.title, paquete.titulo],
      [this.config.texts.labels.origin, paquete.origen],
      [this.config.texts.labels.startDate, this.formatDate(paquete.fecha_inicio)],
      [this.config.texts.labels.endDate, this.formatDate(paquete.fecha_fin)],
      [this.config.texts.labels.duration, `${paquete.duracion_dias} ${this.config.texts.labels.days}`],
      [this.config.texts.labels.totalPrice, this.formatPrice(paquete.precio_total)],
      [this.config.texts.labels.discount, `${paquete.descuento}%`],
      [this.config.texts.labels.advance, paquete.anticipo ? this.formatPrice(paquete.anticipo) : this.config.texts.labels.notDefined],
      // Removidos campos no deseados: status, createdAt, updatedAt, originCoords
    ];
  }

  // Formatear todos los datos necesarios para la plantilla
  formatPaqueteData(paquete: Paquete) {
    return {
      basicFields: this.formatBasicInfo(paquete),
      // Aquí puedes agregar más formateos específicos si es necesario
    };
  }
}
