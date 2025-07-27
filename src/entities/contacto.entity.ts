import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('contacto')
export class Contacto {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'varchar', length: 20 })
  num_telefono: string;

  @Column({ type: 'varchar', length: 20 })
  num_whatsapp: string;

  @Column({ type: 'varchar', length: 255 })
  correo_electronico: string;

  @Column({ type: 'text' })
  direccion: string;

  @Column({ type: 'text' })
  descripcion: string;
}