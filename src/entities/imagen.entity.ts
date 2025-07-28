import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';
import { Hotel } from './hotel.entity';
import { Exclude } from 'class-transformer';

@Entity('imagenes')
export class Imagen {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ nullable: true })
  paquete_id: string;

  @Column({ type: 'bigint', unsigned: true, nullable: true })
  hotel_id: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  orden: number;

  @Column({
    type: 'enum',
    enum: ['base64', 'url'],
    default: 'url',
  })
  tipo: string;

  @Column({ type: 'mediumtext' })
  contenido: string;

  @Column({ type: 'varchar', length: 50 })
  mime_type: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;
  @ManyToOne(() => Paquete, (paquete) => paquete.imagenes, {
    onDelete: 'CASCADE',
    nullable: true, // <-- AÑADIR ESTO
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;

  @ManyToOne(() => Hotel, (hotel) => hotel.imagenes, {
    onDelete: 'CASCADE',
    nullable: true, // <-- AÑADIR ESTO
  })
  @JoinColumn({ name: 'hotel_id' })
  @Exclude()
  hotel: Hotel;
}
