import { Job } from 'bull';
import { DatabaseService } from 'src/database/database.service';
export declare class TradeConsumer {
    private readonly dbService;
    constructor(dbService: DatabaseService);
    processTrade(job: Job<any>): Promise<void>;
}
