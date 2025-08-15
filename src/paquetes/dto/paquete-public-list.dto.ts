export interface PaquetePublicListDto {
  codigoUrl: string;
  titulo: string;
  destinos_nombres: string; // "Roma, Italia" o lista de destinos
  precio_total: number;
  moneda: string;
  duracion_dias: number;
  primera_imagen?: string | null;
  activo: boolean;
  descuento?: number;
}
