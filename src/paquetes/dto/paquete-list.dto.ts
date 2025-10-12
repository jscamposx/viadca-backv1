import { Mayoristas } from '../../entities/mayoristas.entity';
import { MonedaPaquete } from './create-paquete.dto';

export class PaqueteListDto {
  id: string;
  primera_imagen: string | null;
  mayoristas: Mayoristas[];
  url: string;
  titulo: string;
  activo: boolean;
  precio_total: number;
  moneda: MonedaPaquete;
  favorito?: boolean;
  personas?: number | null;
}
