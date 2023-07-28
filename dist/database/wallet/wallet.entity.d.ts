import { Status } from '../user/user.entity';
declare enum YesNo {
    YES = "Yes",
    NO = "No"
}
export declare enum Coin {
    BTC = "BTC",
    BNB = "BNB",
    USDT = "USDT",
    ETH = "ETH",
    DRNH = "DRNH",
    BUSD = "BUSD",
    TRX = "TRX"
}
export declare class Wallet {
    id: number;
    user_id: number;
    deposit_address: string;
    usdt_balance: number;
    bnb_balance: number;
    eth_balance: number;
    btc_balance: number;
    drnh_balance: number;
    white_listed: YesNo;
    status: Status;
    network: string;
    privateKey: string;
    created_at: Date;
}
export {};
