import { DatabaseService } from 'src/database/database.service';
import { OrderBook } from 'src/database/order_book/order_book.entity';
import { Trade } from 'src/database/trade/trade.entity';
import { SocketGateway } from 'src/socket/socket.gateway';
import DecimalFormat from 'decimal-format';
export declare class OrderBookService {
    private dbService;
    private readonly socketServer;
    df: DecimalFormat;
    private order_books;
    constructor(dbService: DatabaseService, socketServer: SocketGateway);
    saveOrder(order: OrderBook): Promise<any>;
    saveMarketOrder(order: OrderBook): Promise<any>;
    saveTrade(trade: Trade): Promise<void>;
    getAllOrders(user_id: any, symbol: string, limit?: number): Promise<OrderBook[]>;
    fillOrderBook(symbol: string): Promise<void>;
    fillOrderBookAndReturn(symbol: string): Promise<any>;
    handleOrder(order: OrderBook): Promise<any>;
    matchLimitOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    matchMarketOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    currentTime(): string;
    matchBuyOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    matchSellOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    fetchAllCoinOrders(userid: number): Promise<OrderBook[]>;
    matchMarketBuyOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    matchMarketSellOrder(order: OrderBook): Promise<{
        success: boolean;
        message: string;
    }>;
    updateOrder(symbol: any, rowid: any, update: any): Promise<void>;
    emitSocketData(symbol: any): Promise<void>;
}
