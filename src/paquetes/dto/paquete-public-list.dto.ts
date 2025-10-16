export interface PaquetePublicListDto {
  codigoUrl: string;
  titulo: string;
  destinos: Array<{ ciudad: string; estado?: string | null; pais: string }>;// "Roma, Italia" o lista de destinos
  precio_total: number;
  moneda: string;
  duracion_dias: number;
  primera_imagen?: string | null;
  activo: boolean;
  descuento?: number;
  mayoristas_tipos: string[]; // tipos de producto de mayoristas asociados
  favorito?: boolean;
  personas?: number | null;
  esPublico?: boolean; // true = público, false = privado (solo informativo)
}
