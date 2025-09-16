import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  IsPositive,
  IsArray,
  ValidateNested,
  IsUUID,
  ValidateIf,
  // MaxLength, // removido para liberar límites
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UpdateHotelDto } from './update-hotel.dto';
import { UpdateImagenDto } from './update-imagen.dto';
import { CreateDestinoDto } from './create-destino.dto';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';
import { MonedaPaquete } from './create-paquete.dto';

export class UpdatePaqueteDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto' })
  // @MaxLength(200)
  @IsNoSQLInjection({ message: 'El título contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El título contiene contenido no válido' })
  readonly titulo?: string;

  @IsOptional()
  @IsString({ message: 'El origen debe ser una cadena de texto' })
  // @MaxLength(100)
  @IsNoSQLInjection({ message: 'El origen contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El origen contiene contenido no válido' })
  readonly origen?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La latitud del origen debe ser un número' })
  readonly origen_lat?: number;

  @IsOptional()
  @IsNumber({}, { message: 'La longitud del origen debe ser un número' })
  readonly origen_lng?: number;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida' })
  readonly fecha_inicio?: Date;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida' })
  readonly fecha_fin?: Date;

  @IsOptional()
  @ValidateIf((o) => o.incluye !== null)
  @IsString({ message: 'Lo que incluye debe ser una cadena de texto' })
  // @MaxLength(2000)
  @IsNoSQLInjection({
    message: 'Lo que incluye contiene caracteres no permitidos',
  })
  @IsCleanText({ message: 'Lo que incluye contiene contenido no válido' })
  readonly incluye?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.no_incluye !== null)
  @IsString({ message: 'Lo que no incluye debe ser una cadena de texto' })
  // @MaxLength(2000)
  @IsNoSQLInjection({
    message: 'Lo que no incluye contiene caracteres no permitidos',
  })
  @IsCleanText({ message: 'Lo que no incluye contiene contenido no válido' })
  readonly no_incluye?: string | null;

  @IsOptional()
  @ValidateIf((o) => o.requisitos !== null)
  @IsString({ message: 'Los requisitos deben ser una cadena de texto' })
  // @MaxLength(2000)
  @IsNoSQLInjection({
    message: 'Los requisitos contienen caracteres no permitidos',
  })
  @IsCleanText({ message: 'Los requisitos contienen contenido no válido' })
  readonly requisitos?: string | null;

  @IsOptional()
  @IsNumber({}, { message: 'El descuento debe ser un número' })
  @Min(0, { message: 'El descuento no puede ser negativo' })
  readonly descuento?: number;

  @IsOptional()
  @ValidateIf((o) => o.anticipo !== null)
  @IsNumber({}, { message: 'El anticipo debe ser un número' })
  @IsPositive({ message: 'El anticipo debe ser un número positivo' })
  readonly anticipo?: number | null;

  @IsOptional()
  @IsNumber({}, { message: 'El precio total debe ser un número' })
  @IsPositive({ message: 'El precio total debe ser un número positivo' })
  readonly precio_total?: number;

  // Moneda editable en actualización
  @IsOptional()
  @IsEnum(MonedaPaquete, { message: 'La moneda debe ser MXN o USD' })
  readonly moneda?: MonedaPaquete;

  @IsOptional()
  @ValidateIf((o) => o.notas !== null)
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  // @MaxLength(1000)
  @IsNoSQLInjection({ message: 'Las notas contienen caracteres no permitidos' })
  @IsCleanText({ message: 'Las notas contienen contenido no válido' })
  readonly notas?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  readonly activo?: boolean;

  @IsOptional()
  @ValidateIf((o) => o.hotel !== null)
  @ValidateNested()
  @Type(() => UpdateHotelDto)
  readonly hotel?: UpdateHotelDto | null;

  @IsOptional()
  @IsArray({ message: 'Los IDs de mayoristas deben ser un arreglo' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de mayorista debe ser un UUID válido',
  })
  readonly mayoristasIds?: string[];

  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => UpdateImagenDto)
  readonly imagenes?: UpdateImagenDto[];

  @IsOptional()
  @IsArray({ message: 'Los destinos deben ser un arreglo' })
  @ValidateNested({ each: true })
  @Type(() => CreateDestinoDto)
  readonly destinos?: CreateDestinoDto[];

  @IsOptional()
  @IsString({ message: 'El itinerario de texto debe ser una cadena de texto' })
  // @MaxLength(5000)
  @IsNoSQLInjection({
    message: 'El itinerario de texto contiene caracteres no permitidos',
  })
  @IsCleanText({
    message: 'El itinerario de texto contiene contenido no válido',
  })
  readonly itinerario_texto?: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo favorito debe ser booleano' })
  readonly favorito?: boolean;
}
