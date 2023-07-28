import { QueueService } from '../web3/queue.provider';
export declare class CronService {
    private readonly queueService;
    constructor(queueService: QueueService);
    handleWithdrawalCron(): Promise<void>;
    handleDepositCron(): Promise<void>;
}
