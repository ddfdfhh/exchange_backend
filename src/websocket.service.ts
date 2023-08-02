/*eslint-disable*/
import { Injectable } from '@nestjs/common';
import * as WebSocket from 'ws';

@Injectable()
export class WSService {
  // wss://echo.websocket.org is a test websocket server
  private ws = new WebSocket('wss://stream.binance.com:9443/ws');

  constructor() {
    this.ws.on('open', () => {
      console.log('socket opened')
    });

    this.ws.on('message', function (message) {
      console.log('rcved',message);
    });
  }

  send(data: any) {
    this.ws.send(data);
  }

  onMessage(handler: Function) {
      console.log('handdler');
  }

 
}
