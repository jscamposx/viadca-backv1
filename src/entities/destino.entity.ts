import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Exclude } from 'class-transformer';
@Entity('destinos')
export class Destino {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paquete_id: string;

  @Column({ type: 'varchar', length: 255 })
  destino: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destino_lng: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  destino_lat: number;

  @Column({ type: 'int', unsigned: true })
  orden: number;

  @ManyToOne(() => Paquete, (paquete) => paquete.destinos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;
}
