import { Entity, Column, ManyToMany } from 'typeorm';
import { SoftDeleteEntity } from './base/soft-delete.entity';
import { Paquete } from '../paquetes/entidades/paquete.entity';

@Entity('mayoristas')
export class Mayoristas extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  tipo_producto: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  clave: string;

  @ManyToMany(() => Paquete, (paquete) => paquete.mayoristas)
  paquetes: Paquete[];
}
