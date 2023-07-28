export declare class WSService {
    private ws;
    constructor();
    send(data: any): void;
    onMessage(handler: Function): void;
}
