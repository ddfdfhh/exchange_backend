/* eslint-disable*/
import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { DatabaseModule } from 'src/database/database.module';

@Module({
    imports: [DatabaseModule],
    providers: [SocketGateway],
   exports:[SocketGateway]
})
export class SocketModule {}
