import LimitOrderDto from '../dto/limit_order.dto';
import MarketOrderDto from '../dto/market_order.dto';
import { OrderBookService } from './order-book.service';
import { OrderBook } from 'src/database/order_book/order_book.entity';
export declare class OrderBookController {
    private readonly bookService;
    constructor(bookService: OrderBookService);
    getAllOrders(post: Record<string, any>, req: any): Promise<{
        success: boolean;
        message: string;
        data: OrderBook[];
    }>;
    create(createOrderDto: LimitOrderDto, req: any): Promise<any>;
    createMarket(createOrderDto: MarketOrderDto, req: any): Promise<any>;
    fetchOrders(): Promise<void>;
    fetchAllCoinOrders(req: any): Promise<{
        success: boolean;
        message: string;
        data: OrderBook[];
    }>;
}
