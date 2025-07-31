import { Mayoristas } from '../../entities/mayoristas.entity';

export class PaqueteListDto {
  id: string;
  primera_imagen: string | null;
  mayoristas: Mayoristas[];
  url: string;
  titulo: string;
  activo: boolean;
  precio_total: number;
}
