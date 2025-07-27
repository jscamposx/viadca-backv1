import { IsString, IsNotEmpty } from 'class-validator';

export class CreateMayoristaDto {
  @IsString()
  @IsNotEmpty()
  readonly nombre: string;

  @IsString()
  @IsNotEmpty()
  readonly tipo_producto: string;
}