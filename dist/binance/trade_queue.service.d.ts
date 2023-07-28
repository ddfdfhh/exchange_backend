import { Queue } from 'bull';
export declare class TradeQueueService {
    private tQueue;
    private job;
    constructor(tQueue: Queue);
    initiateTradeJob(item: any): Promise<void>;
}
