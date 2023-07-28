import { Web3 } from 'web3';
import { HttpService } from '@nestjs/axios';
import { Coin } from 'src/database/wallet/wallet.entity';
import { DatabaseService } from 'src/database/database.service';
export declare class Web3Service {
    private readonly web3;
    private readonly ethWeb3;
    private readonly httpService;
    private readonly dbService;
    private ethConfirmationCountTarget;
    private bscConfirmationCountTarget;
    constructor(web3: Web3, ethWeb3: Web3, httpService: HttpService, dbService: DatabaseService);
    getCurrentBlock(): Promise<bigint>;
    findTransactionForDeposit(address: string, amount: number, coin: Coin, network: string, blocknumber: number): Promise<any>;
    testScanApi(): Promise<void>;
    receipt(hash: string, from_address: string, network: string): Promise<any>;
    getConfirmations(txHash: any, network: string): Promise<bigint | 0>;
}
