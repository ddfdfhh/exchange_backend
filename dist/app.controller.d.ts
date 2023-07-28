import { DatabaseService } from './database/database.service';
import { Coin } from './database/wallet/wallet.entity';
import { Web3Service } from './web3/web3.service';
import { QueueService } from './web3/queue.provider';
export declare class AppController {
    private readonly dbService;
    private readonly web3Service;
    private readonly queueService;
    constructor(dbService: DatabaseService, web3Service: Web3Service, queueService: QueueService);
    first(): Promise<string>;
    hook(obj: any): void;
    addWebhookId(obj: {
        hook_id: string;
        hash: string;
        to: string;
        coin: Coin;
        network: string;
    }): string;
}
