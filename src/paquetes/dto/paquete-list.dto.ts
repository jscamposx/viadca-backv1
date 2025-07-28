export class PaqueteListDto {
  id: string;
  primera_imagen: string | null;
  mayorista: string | null;
  url: string;
  titulo: string;
  activo: boolean;
  precio_total: number;
}