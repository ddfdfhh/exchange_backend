/* eslint-disable*/
import { Inject, forwardRef } from '@nestjs/common';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DatabaseService } from 'src/database/database.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway {

  constructor(@Inject(DatabaseService)
  private readonly dbService: DatabaseService,
  ) { }
  @WebSocketServer()
  server: Server;
  @SubscribeMessage('send_message')
  listenForMessages(@MessageBody() data: string) {
    this.server.sockets.emit('receive_message', data);
  }


  @SubscribeMessage('get_data')
  async listenForOrder(client: Socket, payload: any) {
    
    const buy_orders = await this.dbService.findOrders('BUY', payload.symbol, 100, 'ASC');
    const sell_orders = await this.dbService.findOrders('SELL', payload.symbol, 100, 'DESC');
    const trades = await this.dbService.getAllTrades(payload.symbol, 20);
    const last_24_hour_data = await this.dbService.last_24_hours_data();
    const price_before_24_hour = await this.dbService.price_before_24_hour();
   
    const change_in_price = trades[0] !== undefined ? trades[0].price - price_before_24_hour : 0;
 
    let precentage_change = null;
     if (price_before_24_hour > 0) {
       if (change_in_price > 0) {
         precentage_change =
           '+' +
           new Intl.NumberFormat('en-IN').format(
             (change_in_price * 100) / price_before_24_hour,
           ) +
           '%';
       } else
         precentage_change =
           new Intl.NumberFormat('en-IN').format(
             (change_in_price * 100) / price_before_24_hour,
           ) + '%';
    }
    else  precentage_change = '0';
    const resp = {
      buy_orders: buy_orders,
      sell_orders: sell_orders,
      trades: trades,
      last_trade: trades[0],
      last_24_hour_data,
    
      precentage_change,
      change_in_price,
    };

   
    this.server.sockets.emit('message', JSON.stringify(resp))
   
  }
  async klineForDrnh(interval: string) {
    const listOfTrades=await this.dbService

  }
}
