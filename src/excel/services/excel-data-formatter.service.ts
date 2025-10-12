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
    const fields: Array<[string, string] | null> = [
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
      // Precio por persona solo si personas está definido
      paquete.personas && paquete.personas > 0
        ? [
            'Precio por Persona',
            this.formatPrice(paquete.precio_total / paquete.personas),
          ]
        : null,
      // Personas solo si tiene valor
      paquete.personas && paquete.personas > 0
        ? [
            this.config.texts.labels.peopleCount,
            `${paquete.personas.toLocaleString(this.config.formatting.locale)} ${this.config.texts.labels.peopleUnit}`,
          ]
        : null,
      // Precio vuelo solo si tiene valor
      paquete.precio_vuelo && paquete.precio_vuelo > 0
        ? [this.config.texts.labels.flightPrice, this.formatPrice(paquete.precio_vuelo)]
        : null,
      // Precio hospedaje solo si tiene valor
      paquete.precio_hospedaje && paquete.precio_hospedaje > 0
        ? [this.config.texts.labels.lodgingPrice, this.formatPrice(paquete.precio_hospedaje)]
        : null,
      // Descuento solo si es mayor a 0
      paquete.descuento && paquete.descuento > 0
        ? [this.config.texts.labels.discount, `${paquete.descuento}%`]
        : null,
      // Anticipo solo si tiene valor
      paquete.anticipo && paquete.anticipo > 0
        ? [this.config.texts.labels.advance, this.formatPrice(paquete.anticipo)]
        : null,
    ];

    // Filtrar nulls y devolver solo campos con valor
    return fields.filter((field): field is [string, string] => field !== null);
  }

  formatPaqueteData(paquete: Paquete) {
    return {
      basicFields: this.formatBasicInfo(paquete),
    };
  }
}
