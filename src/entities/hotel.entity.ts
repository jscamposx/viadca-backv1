import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Imagen } from './imagen.entity';
import { Exclude } from 'class-transformer';
@Entity('hoteles')
export class Hotel {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column()
  paquete_id: string;

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

  @Column({ type: 'text' })
  descripcion: string;

  @ManyToOne(() => Paquete, (paquete) => paquete.hoteles, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;

  @OneToMany(() => Imagen, (imagen) => imagen.hotel)
  imagenes: Imagen[];
}
