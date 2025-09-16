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
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  paquete_id: string;

  @Column({ type: 'int', unsigned: true })
  dia_numero: number;

  // Aumentar capacidad al máximo para descripciones largas
  @Column({ type: 'longtext' })
  descripcion: string;

  @ManyToOne(() => Paquete, (paquete) => paquete.itinerarios, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'paquete_id' })
  @Exclude()
  paquete: Paquete;
}
