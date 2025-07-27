import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
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

  @Column({ type: 'varchar', length: 255 })
  titulo: string;

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

  @OneToMany(() => Hotel, (hotel) => hotel.paquete, {
    cascade: true,
  })
  hoteles: Hotel[];

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
