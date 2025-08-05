import { Entity, Column } from 'typeorm';
import { SoftDeleteEntity } from './base/soft-delete.entity';

@Entity('usuarios')
export class Usuario extends SoftDeleteEntity {
  @Column({ type: 'varchar', length: 100 })
  usuario: string;

  @Column({ type: 'varchar', length: 255 })
  contrasena: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'pre-autorizado'],
    default: 'pre-autorizado',
  })
  rol: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'varchar', length: 255, unique: true })
  correo: string;

  @Column({ type: 'text', nullable: true })
  token: string;
}
