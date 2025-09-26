import { Injectable } from '@nestjs/common';
import { Paquete } from '../../paquetes/entidades/paquete.entity';
import { EXCEL_TEMPLATE_CONFIG } from '../config/template.config';

@Injectable()
export class ExcelDataFormatterService {
  private config = EXCEL_TEMPLATE_CONFIG;

  formatDate(date: any): string {
    if (!date) return this.config.texts.labels.notSpecified;
    const dateObj = date instanceof Date ? date : new Date(date);
    return isNaN(dateObj.getTime())
      ? this.config.texts.labels.invalidDate
      : dateObj.toLocaleDateString(this.config.formatting.locale);
  }

  formatPrice(price: number | null | undefined): string {
    if (!price && price !== 0) return this.config.texts.labels.notSpecified;
    return `${this.config.formatting.currency.symbol}${price.toLocaleString(
      this.config.formatting.locale,
      {
        minimumFractionDigits:
          this.config.formatting.currency.minimumFractionDigits,
      },
    )}`;
  }

  formatBasicInfo(paquete: Paquete): Array<[string, string]> {
    return [
      [this.config.texts.labels.title, paquete.titulo],
      [this.config.texts.labels.origin, paquete.origen],
      [
        this.config.texts.labels.startDate,
        this.formatDate(paquete.fecha_inicio),
      ],
      [this.config.texts.labels.endDate, this.formatDate(paquete.fecha_fin)],
      [
        this.config.texts.labels.duration,
        `${paquete.duracion_dias} ${this.config.texts.labels.days}`,
      ],
      [
        this.config.texts.labels.totalPrice,
        this.formatPrice(paquete.precio_total),
      ],
      [
        this.config.texts.labels.flightPrice,
        this.formatPrice(paquete.precio_vuelo ?? null),
      ],
      [
        this.config.texts.labels.lodgingPrice,
        this.formatPrice(paquete.precio_hospedaje ?? null),
      ],
      [this.config.texts.labels.discount, `${paquete.descuento}%`],
      [
        this.config.texts.labels.advance,
        paquete.anticipo
          ? this.formatPrice(paquete.anticipo)
          : this.config.texts.labels.notDefined,
      ],
    ];
  }

  formatPaqueteData(paquete: Paquete) {
    return {
      basicFields: this.formatBasicInfo(paquete),
    };
  }
}
