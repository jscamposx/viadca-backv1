import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Exclude } from 'class-transformer';

@Entity('itinerario')
export class Itinerario {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  paquete_id: number;

  @Column({ type: 'int', unsigned: true })
  dia_numero: number;

  @Column({ type: 'text' })
  descripcion: string;

  @ManyToOne(() => Paquete, (paquete) => paquete.itinerarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;
}
