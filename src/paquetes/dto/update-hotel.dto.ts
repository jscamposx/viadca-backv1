import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsArray,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateImagenDto } from './update-imagen.dto';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class UpdateHotelDto {
  @IsOptional()
  @IsString({ message: 'El ID del lugar debe ser una cadena de texto' })
  @MaxLength(255, {
    message: 'El ID del lugar no puede tener más de 255 caracteres',
  })
  @IsNoSQLInjection({
    message: 'El ID del lugar contiene caracteres no permitidos',
  })
  readonly placeId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(200, { message: 'El nombre no puede tener más de 200 caracteres' })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  readonly nombre?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  readonly descripcion?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Las estrellas deben ser un número' })
  @Min(0, { message: 'Las estrellas no pueden ser negativas' })
  @Max(5, { message: 'Las estrellas no pueden ser más de 5' })
  readonly estrellas?: number;

  @IsOptional()
  @IsBoolean({ message: 'isCustom debe ser un valor booleano' })
  readonly isCustom?: boolean;

  @IsOptional()
  @IsNumber({}, { message: 'El total de calificaciones debe ser un número' })
  @Min(0, { message: 'El total de calificaciones no puede ser negativo' })
  readonly total_calificaciones?: number;

  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => UpdateImagenDto)
  readonly imagenes?: UpdateImagenDto[];
}
