import { IsString, IsNotEmpty, IsNumber, MaxLength } from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class CreateDestinoDto {
  @IsString({ message: 'El destino debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El destino no puede estar vacío' })
  @MaxLength(100, {
    message: 'El destino no puede tener más de 100 caracteres',
  })
  @IsNoSQLInjection({ message: 'El destino contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El destino contiene contenido no válido' })
  readonly destino: string;

  @IsNumber({}, { message: 'La longitud del destino debe ser un número' })
  readonly destino_lng: number;

  @IsNumber({}, { message: 'La latitud del destino debe ser un número' })
  readonly destino_lat: number;

  @IsNumber({}, { message: 'El orden debe ser un número' })
  readonly orden: number;
}
