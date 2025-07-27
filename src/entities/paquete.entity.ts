import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Itinerario } from './itinerario.entity';
import { Hotel } from './hotel.entity';
import { Destino } from './destino.entity';
import { Imagen } from './imagen.entity';
import { Mayorista } from './mayorista.entity';

@Entity('paquetes')
export class Paquete {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'int', unsigned: true })
  duracion_dias: number;

  @Column({ type: 'text' })
  incluye: string;

  @Column({ type: 'text' })
  no_incluye: string;

  @Column({ type: 'text' })
  requisitos: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  anticipo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_total: number;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @OneToMany(() => Itinerario, (itinerario) => itinerario.paquete)
  itinerarios: Itinerario[];

  @OneToMany(() => Hotel, (hotel) => hotel.paquete)
  hoteles: Hotel[];

  @OneToMany(() => Destino, (destino) => destino.paquete)
  destinos: Destino[];

  @OneToMany(() => Imagen, (imagen) => imagen.paquete)
  imagenes: Imagen[];

  @OneToMany(() => Mayorista, (mayorista) => mayorista.paquete)
  mayoristas: Mayorista[];
}