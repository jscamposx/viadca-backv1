import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { UsuarioRol } from '../../entities/usuario.entity';

export class UpdateUsuarioRolDto {
  @IsOptional()
  @IsEnum(UsuarioRol)
  rol?: UsuarioRol;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
