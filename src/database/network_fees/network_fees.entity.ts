/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';



@Entity('nw_fees')
export class NetworkFee {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({
    type: 'decimal',
    precision: 10,
    scale: 6,
    default: () => 0.0,
  })
  fees: number;
  @Column({
    type: 'decimal',
    precision: 18,
    scale: 10,
    default: () => 0.0,
  })
  with_limit: number;
 
  
  @Column({
    length: 100,
   
  })
  network: string;
  
  
}
