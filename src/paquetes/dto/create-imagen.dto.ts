import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsUUID,
  MaxLength,
  IsIn,
} from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class CreateImagenDto {
  @IsOptional()
  @IsUUID('4', { message: 'El ID del hotel debe ser un UUID válido' })
  hotel_id?: string;

  @IsOptional()
  @IsNumber({}, { message: 'El orden debe ser un número' })
  orden?: number;

  @IsString({ message: 'El tipo debe ser una cadena de texto' })
  @IsIn(['url', 'google_places_url', 'cloudinary'], {
    message: 'El tipo debe ser url, google_places_url o cloudinary',
  })
  tipo: string;

  @IsString({ message: 'El contenido debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El contenido no puede estar vacío' })
  @MaxLength(2000, {
    message: 'El contenido no puede tener más de 2000 caracteres',
  })
  @IsNoSQLInjection({
    message: 'El contenido contiene caracteres no permitidos',
  })
  contenido: string;

  @IsString({ message: 'El tipo MIME debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El tipo MIME no puede estar vacío' })
  @MaxLength(100, {
    message: 'El tipo MIME no puede tener más de 100 caracteres',
  })
  @IsNoSQLInjection({
    message: 'El tipo MIME contiene caracteres no permitidos',
  })
  mime_type: string;

  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(255, { message: 'El nombre no puede tener más de 255 caracteres' })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  nombre: string;

  @IsOptional()
  @IsString({
    message: 'El ID público de Cloudinary debe ser una cadena de texto',
  })
  @MaxLength(255, {
    message: 'El ID público de Cloudinary no puede tener más de 255 caracteres',
  })
  @IsNoSQLInjection({
    message: 'El ID público de Cloudinary contiene caracteres no permitidos',
  })
  cloudinary_public_id?: string;

  @IsOptional()
  @IsString({ message: 'La URL de Cloudinary debe ser una cadena de texto' })
  @MaxLength(500, {
    message: 'La URL de Cloudinary no puede tener más de 500 caracteres',
  })
  @IsNoSQLInjection({
    message: 'La URL de Cloudinary contiene caracteres no permitidos',
  })
  cloudinary_url?: string;
}
