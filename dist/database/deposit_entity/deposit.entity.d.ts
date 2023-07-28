import { Coin } from '../wallet/wallet.entity';
import { Status } from '../withdrawal_entity/withdrawal.entity';
import { YesNo } from '../user/user.entity';
export declare class Deposit {
    id: number;
    user_id: number;
    from_address: string;
    to_address: string;
    amount: number;
    coin: Coin;
    network: string;
    deleted: YesNo;
    status: Status;
    transaction_hash: string;
    response: string;
    reason: string;
    start_block: number;
    confirmations: number;
    created_at: Date;
    updated_at: Date;
}
