import { IsString, IsOptional, MaxLength } from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class UploadImageDto {
  @IsOptional()
  @IsString({ message: 'La carpeta debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'La carpeta no puede tener más de 100 caracteres',
  })
  @IsNoSQLInjection({ message: 'La carpeta contiene caracteres no permitidos' })
  @IsCleanText({ message: 'La carpeta contiene contenido no válido' })
  folder?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El nombre no puede tener más de 255 caracteres' })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  nombre?: string;
}
