export default interface LimitOrderDto {
    uid: number;
    side: string;
    symbol: string;
    price: number;
    size: number;
}
