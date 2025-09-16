import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  MaxLength,
} from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'El usuario no puede estar vacío' })
  @IsString({ message: 'El usuario debe ser una cadena de texto' })
  @MinLength(3, { message: 'El usuario debe tener al menos 3 caracteres' })
  @MaxLength(50, { message: 'El usuario no puede tener más de 50 caracteres' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'El usuario solo puede contener letras, números, guiones y guiones bajos',
  })
  @IsNoSQLInjection({ message: 'El usuario contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El usuario contiene contenido no válido' })
  usuario: string;

  @IsNotEmpty({ message: 'El correo no puede estar vacío' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @MaxLength(255, { message: 'El correo no puede tener más de 255 caracteres' })
  @IsNoSQLInjection({ message: 'El correo contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El correo contiene contenido no válido' })
  correo: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100, {
    message: 'La contraseña no puede tener más de 100 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
  })
  @IsNoSQLInjection({
    message: 'La contraseña contiene caracteres no permitidos',
  })
  contrasena: string;

  @IsOptional()
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @MaxLength(100, {
    message: 'El nombre completo no puede tener más de 100 caracteres',
  })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre completo solo puede contener letras y espacios',
  })
  @IsNoSQLInjection({
    message: 'El nombre completo contiene caracteres no permitidos',
  })
  @IsCleanText({ message: 'El nombre completo contiene contenido no válido' })
  nombre_completo?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre solo puede contener letras y espacios',
  })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  nombre?: string;
}
