/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { YesNo } from '../user/user.entity';

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'Verfied',
  CANCELLED = 'Cancelled',
}

@Entity('tbl_identity')
export class Identity {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  user_id: number;
  @Column()
  email: string;

  @Column({ type: 'text' })
  address: string;
  @Column({ length: 300 })
  fullname: string;

  @Column({ length: 300 })
  govIdNumber: string;
  @Column({ length: 300 })
  panNumber: string;
  @Column({ length: 100 })
  type: string;
  @Column({ length: 100 })
  country: string;
  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  verification_status: VerificationStatus;

  @Column({
    type: 'enum',
    enum: YesNo,
    default: YesNo.NO,
  })
  id_verified: YesNo;
  @Column({ length: 300, nullable: true })
  front_path: string;
  @Column({ length: 300, nullable: true })
  back_path: string;
  @Column({ length: 300, nullable: true })
  pan: string;
  @Column({ type:'longtext', nullable: true })
  selfie: string;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
