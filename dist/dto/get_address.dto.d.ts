import { Coin } from 'src/database/wallet/wallet.entity';
export declare class GetAddressDto {
    user_id: number;
    coin: Coin;
    network: string;
}
