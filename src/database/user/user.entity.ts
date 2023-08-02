/* eslint-disable*/
import {
  Entity,
  Column,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum Status {
  ACTIVE = 'Active',
  INACTIVE = 'In-Active',
  BLACKLISTED = 'Blacklisted',
}
export enum YesNo {
  YES = 'Yes',
  NO = 'No'
 
}
@Entity('tbl_users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 300 })
  email: string;
  @Column({ length: 300 })
  name: string;
  @Column({ length: 300 })
  uuid: string;
  @Column({ length: 300, nullable: true })
  referral_id: string;
  @Column({ length: 300 })
  password: string;
  @Column({ length: 300 })
  zasper_id: string;
  @Column({ length: 50, nullable: true })
  phone_number: string;
  @Column({ type: 'text', nullable: true })
  refreshToken: string;
  @Column({ nullable: true })
  twofa_secret: string;
  @Column({
    type: 'enum',
    enum: Status,
    default: Status.ACTIVE,
  })
  status: Status;
  @Column({
    type: 'enum',
    enum: YesNo,
    default: YesNo.NO,
  })
  email_verified: YesNo;
  @Column({
    type: 'enum',
    enum: YesNo,
    default: YesNo.NO,
  })
  is_two_fa_enabled: YesNo;
  @Column({
    type: 'enum',
    enum: YesNo,
    default: YesNo.NO,
  })
  id_verified: YesNo;
  @Column({ type: 'decimal', precision: 17, scale: 8, default: 0.0 })
  spot_wallet: number;
  @Column({ type: 'decimal', precision: 17, scale: 8, default: 0.0 })
  fund_wallet: number;
  @Column({ length: 300, nullable: true })
  ip_address: string;
  @Column({ type: 'timestamp', nullable: true })
  logged_in_at: Date;
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
