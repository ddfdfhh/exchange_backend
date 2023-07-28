import { Queue } from 'bull';
import { DatabaseService } from 'src/database/database.service';
import { SchedulerRegistry } from '@nestjs/schedule';
export declare class QueueService {
    private wQueue;
    private dQueue;
    private readonly dbService;
    private schedulerRegistry;
    private withdrawal_job;
    private deposit_job;
    constructor(wQueue: Queue, dQueue: Queue, dbService: DatabaseService, schedulerRegistry: SchedulerRegistry);
    initiateWithdrawalJob(): Promise<void>;
    initiateDepositJob(): Promise<void>;
}
