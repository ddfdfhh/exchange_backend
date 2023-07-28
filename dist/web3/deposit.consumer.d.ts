import { Job } from 'bull';
import { Web3Service } from './web3.service';
import { DatabaseService } from 'src/database/database.service';
import { Deposit } from 'src/database/deposit_entity/deposit.entity';
export declare class DepositConsumer {
    private readonly web3Service;
    private readonly dbService;
    constructor(web3Service: Web3Service, dbService: DatabaseService);
    processDeposit(job: Job<any>): Promise<void>;
    updateDepositConfirmationCount(id: number, count: bigint | number): Promise<void>;
    updateDepositlWithStatus(deposit: Deposit, update_data: any): Promise<void>;
}
