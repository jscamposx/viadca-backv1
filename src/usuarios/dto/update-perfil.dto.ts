import {
  IsOptional,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class UpdatePerfilDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  nombre?: string;

  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @MaxLength(255, { message: 'El email no puede exceder 255 caracteres' })
  @IsNoSQLInjection({ message: 'El email contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El email contiene contenido no válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'El teléfono debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El teléfono no puede exceder 20 caracteres' })
  @IsNoSQLInjection({
    message: 'El teléfono contiene caracteres no permitidos',
  })
  @IsCleanText({ message: 'El teléfono contiene contenido no válido' })
  telefono?: string;
}
