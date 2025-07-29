import { IsString, IsOptional } from 'class-validator';

export class UpdateMayoristaDto {
  @IsOptional()
  @IsString()
  readonly nombre?: string;

  @IsOptional()
  @IsString()
  readonly tipo_producto?: string;
}
