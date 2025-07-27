
export class UpdatePaqueteDto {
  readonly titulo?: string;
  readonly slug?: string;
  readonly fecha_inicio?: Date;
  readonly fecha_fin?: Date;
  readonly duracion_dias?: number;
  readonly incluye?: string;
  readonly no_incluye?: string;
  readonly requisitos?: string;
  readonly descuento?: number;
  readonly anticipo?: number;
  readonly precio_total?: number;
  readonly notas?: string;
  readonly activo?: boolean;
}