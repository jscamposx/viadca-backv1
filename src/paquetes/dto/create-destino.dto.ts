import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateDestinoDto {
  @IsString()
  @IsNotEmpty()
  readonly destino: string;

  @IsNumber()
  readonly destino_lng: number;

  @IsNumber()
  readonly destino_lat: number;

  @IsNumber()
  readonly orden: number;
}