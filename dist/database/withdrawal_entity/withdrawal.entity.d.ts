import { Coin } from '../wallet/wallet.entity';
import { YesNo } from '../user/user.entity';
export declare enum Status {
    Pending = "Pending",
    Approved = "Approved",
    Rejected = "Rejected",
    Reverted = "Reverted"
}
export declare class Withdrawal {
    id: number;
    user_id: number;
    from_address: string;
    to_address: string;
    with_amount: number;
    confirmations: number;
    coin: Coin;
    pay_by_admin: YesNo;
    deleted: YesNo;
    network: string;
    webhook_id: string;
    status: Status;
    transaction_hash: string;
    response: string;
    reason: string;
    created_at: Date;
    updated_at: Date;
}
