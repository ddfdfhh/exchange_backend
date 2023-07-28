import { Server, Socket } from 'socket.io';
import { DatabaseService } from 'src/database/database.service';
export declare class SocketGateway {
    private readonly dbService;
    constructor(dbService: DatabaseService);
    server: Server;
    listenForMessages(data: string): void;
    listenForOrder(client: Socket, payload: any): Promise<void>;
}
