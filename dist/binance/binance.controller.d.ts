import { DatabaseService } from 'src/database/database.service';
import { TradeQueueService } from './trade_queue.service';
export declare class BinanceController {
    private readonly dbService;
    private readonly tradeQueueService;
    constructor(dbService: DatabaseService, tradeQueueService: TradeQueueService);
    checkAdminWalletBalance(main_currency: any, secondary_currency: any, side: any, qty: any, price: any, avgPrice: any, type: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getOrderPromise(price: any, qty: any, type: any, symbol: any, side: any, newClientOrderId: any): Promise<any>;
    placeOrder(req: Record<string, any>, req1: any): Promise<{
        success: boolean;
        message: string;
    } | {
        success: boolean;
        message: string;
        data: string;
    }>;
    subscribeListener(): Promise<{
        success: boolean;
        message: any;
    }>;
    waitForOpenConnection(socket: any): Promise<void>;
    handleError(err: any, from?: string, msg?: string): {
        success: boolean;
        message: string;
    };
    getOrderStatus(req: Record<string, number>): Promise<void>;
    getBalance(): Promise<void>;
    getUserOrders(req: any): Promise<{
        success: boolean;
        message: string;
        data: string;
    }>;
    cancelOrder(req: Record<string, any>): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    allOrders(req: Record<string, any>): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    fetchBalanceFromTable(post: Record<string, any>, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            main_balance: any;
            usdt_balance: number;
        };
    }>;
}
