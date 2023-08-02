/* eslint-disable*/
import {
  Entity,
  Column, PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('error_handling')
export class ErrorSave {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  error: string;
  @Column({ nullable: true })
  from: string;
 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

 
}
