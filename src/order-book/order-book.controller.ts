/* eslint-disable*/
import { Body, Controller, Get, Inject, Post, Request, UseGuards } from '@nestjs/common';

import LimitOrderDto from '../dto/limit_order.dto';
import MarketOrderDto from '../dto/market_order.dto';
import { OrderBookService } from './order-book.service';
import { OrderBook } from 'src/database/order_book/order_book.entity';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('orderbooks')
export class OrderBookController {
  constructor(
    @Inject(OrderBookService)
    private readonly bookService: OrderBookService,
  ) {}
  @UseGuards(JwtAuthGuard)
  @Post('userOrders')
  async getAllOrders(@Body() post: Record<string, any>, @Request() req) {
    const user_id = req.user.userId;
    const list = await this.bookService.getAllOrders(
      user_id,
      post.symbol,
      post.limit,
    );
    return { success: true, message: 'fetched', data: list };
  }
  @UseGuards(JwtAuthGuard)
  @Post('create/Limit')
  async create(@Body() createOrderDto: LimitOrderDto, @Request() req) {
    if (req.user != undefined && req.user.userId !== undefined) {
      const resp = await this.bookService.handleOrder({
        uid: req.user.userId,
        type: 'Limit',
        ...createOrderDto,
      } as OrderBook);

      return resp;
    } else return { success: false, message: 'Please login ' };
  }
  @UseGuards(JwtAuthGuard)
  @Post('create/Market')
  async createMarket(@Body() createOrderDto: MarketOrderDto, @Request() req) {
    if (req.user != undefined && req.user.userId !== undefined) {
      const resp = await this.bookService.handleOrder({
        type: 'Market',
        ...createOrderDto,
      } as OrderBook);

      return resp;
    } else return { success: false, message: 'Please login ' };
  }
  @Get()
  async fetchOrders() {
    this.bookService
      .fillOrderBookAndReturn('BTC/ETH')
      .then((val) => {
        console.log('filled', val);
      })
      .catch((er) => {
        console.log('error', er);
      });
  }
  @UseGuards(JwtAuthGuard)
  @Get('fetchAllCoinOrders')
  async fetchAllCoinOrders(@Request() req) {
    const data = await this.bookService.fetchAllCoinOrders(req.user.userId);
    
    return { success: true, message: '', data };
  }
}
