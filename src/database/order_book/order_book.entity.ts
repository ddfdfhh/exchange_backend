/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('tbl_order_books')
export class OrderBook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  uid: number;

  @Column()
  side: string;
  @Column()
  symbol: string;
  @Column({type:'text',nullable:true})
  fills: string;
  @Column()
  type: string;
  @Column({ nullable: true,default:0.0, type: 'decimal', precision: 17, scale: 8 })
  price?: number;
  @Column({ type: 'decimal', precision: 17, scale: 8 })
  size: number;
  @Column({ default:0.0,type: 'decimal', precision: 17, scale: 8 })
  orgSize?: number;
  @Column({ default: 0.0, type: 'decimal', precision: 10, scale: 2 })
  volume?: number;
  @Column()
  is_filled: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
  @Column({ type: 'timestamp', nullable: true })
  settled_at: Date;
  @Column({ nullable: true })
  parent_id: number;
}
