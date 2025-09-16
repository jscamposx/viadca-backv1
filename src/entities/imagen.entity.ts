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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  paquete_id: string;

  @Column({ type: 'uuid', nullable: true })
  hotel_id: string;

  @Column({ type: 'int', unsigned: true, default: 0 })
  orden: number;

  @Column({
    type: 'enum',
    enum: ['url', 'google_places_url', 'cloudinary'],
    default: 'cloudinary',
  })
  tipo: string;

  @Column({ type: 'mediumtext' })
  contenido: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cloudinary_public_id: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  cloudinary_url: string;

  @Column({ type: 'varchar', length: 50 })
  mime_type: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @ManyToOne(() => Paquete, (paquete) => paquete.imagenes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete | null;

  @ManyToOne(() => Hotel, (hotel) => hotel.imagenes, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'hotel_id' })
  @Exclude()
  hotel: Hotel | null;
}
