export declare class OrderBook {
    id: number;
    uid: number;
    side: string;
    symbol: string;
    fills: string;
    type: string;
    price?: number;
    size: number;
    orgSize?: number;
    volume?: number;
    is_filled: boolean;
    created_at: Date;
    settled_at: Date;
    parent_id: number;
}
