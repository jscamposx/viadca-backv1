import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El usuario o correo no puede estar vacío' })
  @IsString({ message: 'El usuario o correo debe ser una cadena de texto' })
  @MaxLength(255, { message: 'El usuario o correo no puede tener más de 255 caracteres' })
  @IsNoSQLInjection({ message: 'El usuario o correo contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El usuario o correo contiene contenido no válido' })
  usuario: string; // Puede ser nombre de usuario o correo electrónico

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MaxLength(100, { message: 'Contraseña demasiado larga' })
  @IsNoSQLInjection({
    message: 'La contraseña contiene caracteres no permitidos',
  })
  contrasena: string;
}

export class ForgotPasswordDto {
  @IsNotEmpty({ message: 'El correo no puede estar vacío' })
  @IsEmail({}, { message: 'Debe ser un correo electrónico válido' })
  @MaxLength(255, { message: 'El correo no puede tener más de 255 caracteres' })
  @IsNoSQLInjection({ message: 'El correo contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El correo contiene contenido no válido' })
  correo: string;
}

export class ResetPasswordDto {
  @IsNotEmpty({ message: 'El token no puede estar vacío' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @Matches(/^[a-f0-9]{64}$/, { message: 'Token inválido' })
  @IsNoSQLInjection({ message: 'El token contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El token contiene contenido no válido' })
  token: string;

  @IsNotEmpty({ message: 'La nueva contraseña no puede estar vacía' })
  @IsString({ message: 'La nueva contraseña debe ser una cadena de texto' })
  @MinLength(8, {
    message: 'La nueva contraseña debe tener al menos 8 caracteres',
  })
  @MaxLength(100, {
    message: 'La nueva contraseña no puede tener más de 100 caracteres',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'La nueva contraseña debe contener al menos una letra minúscula, una mayúscula y un número',
  })
  @IsNoSQLInjection({
    message: 'La nueva contraseña contiene caracteres no permitidos',
  })
  nuevaContrasena: string;
}

export class VerifyEmailDto {
  @IsNotEmpty({ message: 'El token no puede estar vacío' })
  @IsString({ message: 'El token debe ser una cadena de texto' })
  @Matches(/^[a-f0-9]{64}$/, { message: 'Token de verificación inválido' })
  @IsNoSQLInjection({ message: 'El token contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El token contiene contenido no válido' })
  token: string;
}
