import { IsString, IsOptional, MaxLength } from 'class-validator';
import {
  IsNoSQLInjection,
  IsCleanText,
} from '../../common/validators/security.validator';

export class UpdateMayoristaDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  @IsNoSQLInjection({ message: 'El nombre contiene caracteres no permitidos' })
  @IsCleanText({ message: 'El nombre contiene contenido no válido' })
  readonly nombre?: string;

  @IsOptional()
  @IsString({ message: 'El tipo de producto debe ser una cadena de texto' })
  @MaxLength(50, {
    message: 'El tipo de producto no puede tener más de 50 caracteres',
  })
  @IsNoSQLInjection({
    message: 'El tipo de producto contiene caracteres no permitidos',
  })
  @IsCleanText({ message: 'El tipo de producto contiene contenido no válido' })
  readonly tipo_producto?: string;
}
