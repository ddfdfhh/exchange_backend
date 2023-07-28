import { Job } from 'bull';
import { Web3Service } from './web3.service';
import { DatabaseService } from 'src/database/database.service';
import { Withdrawal } from 'src/database/withdrawal_entity/withdrawal.entity';
export declare class WithdrawalConsumer {
    private readonly web3Service;
    private readonly dbService;
    constructor(web3Service: Web3Service, dbService: DatabaseService);
    processWithdrawal(job: Job<any>): Promise<void>;
    updateWithdrawlConfirmationCount(id: number, count: BigInt | 0): Promise<void>;
    updateWithdrawlWithStatus(withdrawal: Withdrawal, update_data: any): Promise<void>;
    onActive(job: Job): void;
    onProgress(job: Job, progress: number): void;
    onCompleted(job: Job, result: any): void;
}
