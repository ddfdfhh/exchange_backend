import { YesNo } from '../user/user.entity';
export declare enum VerificationStatus {
    PENDING = "PENDING",
    VERIFIED = "Verfied",
    CANCELLED = "Cancelled"
}
export declare class Identity {
    id: number;
    user_id: number;
    email: string;
    address: string;
    fullname: string;
    govIdNumber: string;
    panNumber: string;
    type: string;
    country: string;
    verification_status: VerificationStatus;
    id_verified: YesNo;
    front_path: string;
    back_path: string;
    pan: string;
    selfie: string;
    created_at: Date;
}
