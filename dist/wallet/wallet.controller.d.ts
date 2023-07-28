import { DatabaseService } from 'src/database/database.service';
import { GetNetworkFeesDto } from 'src/dto/fees_network.dto';
import { GetAddressDto } from 'src/dto/get_address.dto';
import { WithdrawalDto } from 'src/dto/withdrawal.dto';
import { HttpService } from '@nestjs/axios';
import { DepositDto } from 'src/dto/deposit.dto';
type WithdrawlResponse = {
    success: boolean;
    message: string;
    hash?: string;
    blockHash?: string;
};
export declare class WalletController {
    private readonly dbService;
    private readonly httpService;
    private bsc_api_url;
    private eth_api_url;
    private bsc_testnet_url;
    private bsc_mainnet_url;
    private current_bsc_url;
    private ethProvider;
    private bscProvider;
    private bscTransactionOptionTestnet;
    private bscTransactionOptionMainnet;
    private bscTransactionOption;
    private ethTransactionOptionTestnet;
    private ethTransactionOptionMainnet;
    private ethTransactionOption;
    private btcnetwork;
    private fees;
    constructor(dbService: DatabaseService, httpService: HttpService);
    genAddress(getAddressDto: GetAddressDto): Promise<{
        address: string;
    }>;
    genBalance(getAddressDto: GetAddressDto): Promise<{
        balance: any;
        fees: number;
        todayWithdrawn: any;
        totalLimit: number;
    }>;
    get_network_fees(feesDto: GetNetworkFeesDto): Promise<number>;
    withdrawal(withdrawalDto: WithdrawalDto): Promise<WithdrawlResponse>;
    deposit(depositDto: DepositDto): Promise<{
        success: boolean;
        message: string;
    }>;
    sendUSDTERC20(amount1: any, to_address: any, privateKey: any, fees: any): Promise<WithdrawlResponse>;
    generateAdress(network1: any): Promise<{
        address: string;
        privateKey: string;
    }>;
    sendBitcoin(amount: any, to_address: any, privateKey: any, fees: any): Promise<{
        success: boolean;
        message: string;
        hash?: undefined;
    } | {
        success: boolean;
        message: string;
        hash: any;
    }>;
    getConfirmationsCount(hash: any): Promise<number>;
    transferBep20(amount1: any, to_address: any, privateKey: any, coin: any, fees: any): Promise<WithdrawlResponse>;
    transferBep20USDT(amount1: any, to_address: any, privateKey: any, coin: any, fees: any): Promise<WithdrawlResponse>;
    transferETH(amount1: any, to_address: any, privateKey: any, fees: any): Promise<{
        success: boolean;
        message: string;
        hash: string;
        blockHash?: undefined;
    } | {
        success: boolean;
        message: string;
        hash: string;
        blockHash: string;
    }>;
    transferBNBBep20(amount1: any, to_address: any, privateKey: any, fees: any): Promise<{
        success: boolean;
        message: string;
        hash: string;
        blockHash?: undefined;
    } | {
        success: boolean;
        message: string;
        hash: string;
        blockHash: string;
    }>;
    transferERC20SendCrypto(amount1: any, to_address: any, privateKey: any, coin: any): Promise<{
        success: boolean;
        message: string;
        hash: any;
    }>;
    getBnbAddress(): {
        address: any;
        privateKey: any;
    };
    getABiAndTokenContract(coin: any, network: any): any[];
    getBeaconTransactionStatus(transactionHash: any, apiurl: any): any;
    transferBNBBep2(amount1: any, to_address: any, privateKey: any, memo: any): Promise<any>;
}
export {};
