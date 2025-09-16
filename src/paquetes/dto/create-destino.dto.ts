import { IsString, IsNotEmpty, IsNumber, MaxLength, IsOptional } from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class CreateDestinoDto {
  @IsString({ message: 'La ciudad debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La ciudad no puede estar vacía' })
  @MaxLength(120, {
    message: 'La ciudad no puede tener más de 120 caracteres',
  })
  @IsNoSQLInjection({ message: 'La ciudad contiene caracteres no permitidos' })
  @IsCleanText({ message: 'La ciudad contiene contenido no válido' })
  readonly ciudad: string;

  @IsOptional()
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @MaxLength(120, { message: 'El estado no puede tener más de 120 caracteres' })
  @IsNoSQLInjection({ message: 'El estado contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El estado contiene contenido no válido' })
  readonly estado?: string | null;

  @IsString({ message: 'El país debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El país no puede estar vacío' })
  @MaxLength(120, {
    message: 'El país no puede tener más de 120 caracteres',
  })
  @IsNoSQLInjection({ message: 'El país contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El país contiene contenido no válido' })
  readonly pais: string;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud del destino debe ser un número' })
  readonly destino_lng?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'La latitud del destino debe ser un número' })
  readonly destino_lat?: number | null;

  @IsNumber({}, { message: 'El orden debe ser un número' })
  readonly orden: number;
}
