import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Imagen } from './imagen.entity';
import { Exclude } from 'class-transformer';

@Entity('hoteles')
export class Hotel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  placeId: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'tinyint', unsigned: true })
  estrellas: number;

  @Column({ type: 'boolean', default: false })
  isCustom: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  total_calificaciones: number;

  @OneToOne(() => Paquete, (paquete) => paquete.hotel, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;

  @OneToMany(() => Imagen, (imagen) => imagen.hotel, {
    cascade: true,
  })
  imagenes: Imagen[];
}
