import { Coin } from 'src/database/wallet/wallet.entity';
export declare class WithdrawalDto {
    user_id: number;
    coin: Coin;
    network: string;
    amount: number;
    fees: number;
    balance: number;
    to_address: string;
    memo: string;
}
