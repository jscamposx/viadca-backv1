import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Paquete } from '../paquetes/entidades/paquete.entity';

@Entity('mayoristas')
export class Mayoristas {
  @PrimaryGeneratedColumn('uuid')
id: string;

  @Column({ type: 'varchar', length: 255 })
  nombre: string;

  @Column({ type: 'varchar', length: 100 })
  tipo_producto: string;

  @Column({ type: 'varchar', length: 255, unique: true }) // Clave única
  clave: string;

  @ManyToMany(() => Paquete, (paquete) => paquete.mayoristas)
  paquetes: Paquete[];
}
