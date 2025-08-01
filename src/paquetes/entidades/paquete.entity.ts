import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { Itinerario } from '../../entities/itinerario.entity';
import { Hotel } from '../../entities/hotel.entity';
import { Destino } from '../../entities/destino.entity';
import { Imagen } from '../../entities/imagen.entity';
import { Mayoristas } from '../../entities/mayoristas.entity';

@Entity('paquetes')
export class Paquete {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 5, unique: true })
  codigoUrl: string;

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

  @Column({ type: 'varchar', length: 255 })
  origen: string;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  origen_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  origen_lng: number;

  @Column({ type: 'date' })
  fecha_inicio: Date;

  @Column({ type: 'date' })
  fecha_fin: Date;

  @Column({ type: 'int', unsigned: true })
  duracion_dias: number;

  @Column({ type: 'text', nullable: true })
  incluye: string | null;

  @Column({ type: 'text', nullable: true })
  no_incluye: string | null;

  @Column({ type: 'text', nullable: true })
  requisitos: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  descuento: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  anticipo: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio_total: number;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'creado_en' })
  creadoEn: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  actualizadoEn: Date;

  @OneToMany(() => Itinerario, (itinerario) => itinerario.paquete, {
    cascade: true,
  })
  itinerarios: Itinerario[];

  @OneToOne(() => Hotel, (hotel) => hotel.paquete, {
    cascade: true,
    nullable: true,
  })
  hotel: Hotel | null;

  @OneToMany(() => Destino, (destino) => destino.paquete, {
    cascade: true,
  })
  destinos: Destino[];

  @OneToMany(() => Imagen, (imagen) => imagen.paquete, {
    cascade: true,
  })
  imagenes: Imagen[];

  @ManyToMany(() => Mayoristas, (mayoristas) => mayoristas.paquetes, {
    cascade: true,
  })
  @JoinTable({
    name: 'paquete_mayoristas',
    joinColumn: { name: 'paquete_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'mayorista_id', referencedColumnName: 'id' },
  })
  mayoristas: Mayoristas[];
}
