import { Coin } from './wallet/wallet.entity';
export declare class TokenAddressBalance {
    id: number;
    coin: Coin;
    network: string;
    address: string;
    balance: number;
}
