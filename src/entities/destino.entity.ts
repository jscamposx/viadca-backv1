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

  // Nuevo formato solicitado: ciudad, estado, pais
  @Column({ type: 'varchar', length: 150 })
  ciudad: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  estado: string | null;

  @Column({ type: 'varchar', length: 150 })
  pais: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destino_lng: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  destino_lat: number | null;

  @Column({ type: 'int', unsigned: true })
  orden: number;

  @ManyToOne(() => Paquete, (paquete) => paquete.destinos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;
}
