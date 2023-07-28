"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const socket_gateway_1 = require("../socket/socket.gateway");
const decimal_format_1 = require("decimal-format");
let OrderBookService = class OrderBookService {
    constructor(dbService, socketServer) {
        this.dbService = dbService;
        this.socketServer = socketServer;
        this.df = new decimal_format_1.default('#,##0.0#');
        this.order_books = {
            buy_orders: [],
            sell_orders: [],
        };
    }
    async saveOrder(order) {
        order.volume = order.price * order.size;
        console.log('order', order.volume);
        let saved_order = await this.dbService.saveOrderBook(order);
        await this.fillOrderBook(order.symbol);
        await this.emitSocketData(order.symbol);
        return saved_order.id;
    }
    async saveMarketOrder(order) {
        order.price = null;
        let saved_order = await this.dbService.saveOrderBook(order);
        await this.fillOrderBook(order.symbol);
        return saved_order.id;
    }
    async saveTrade(trade) {
        await this.dbService.saveTrade(trade);
        await this.emitSocketData(trade.symbol);
    }
    async getAllOrders(user_id, symbol, limit = 100) {
        return await this.dbService.getUserOrdersNoSide(user_id, symbol, limit);
    }
    async fillOrderBook(symbol) {
        let buy_orders = [];
        let sell_orders = [];
        buy_orders = await this.dbService.findOrders('BUY', symbol, 100, 'ASC');
        sell_orders = await this.dbService.findOrders('SELL', symbol, 100, 'DESC');
        this.order_books.buy_orders = buy_orders.map((el) => el);
        this.order_books.sell_orders = sell_orders.map((el) => el);
        return;
    }
    async fillOrderBookAndReturn(symbol) {
        let buy_orders = [];
        let sell_orders = [];
        buy_orders = await this.dbService.findOrders('BUY', symbol, 100, 'ASC');
        sell_orders = await this.dbService.findOrders('SELL', symbol, 100, 'DESC');
        this.order_books.buy_orders = buy_orders.map((el) => el);
        this.order_books.sell_orders = sell_orders.map((el) => el);
        return this.order_books;
    }
    async handleOrder(order) {
        order.orgSize = order.size;
        if (order.type == 'Market') {
            let saved_order_id = await this.saveMarketOrder(order);
            order.id = saved_order_id;
            let g = await this.matchMarketOrder(order);
            if (g.success) {
                let order_list = await this.dbService.getUserOrdersNoSide(1, order.symbol, 20);
                return {
                    success: true,
                    message: 'Order Completed Sussesssfully',
                    data: order_list,
                };
            }
            else {
                return {
                    success: false,
                    message: 'Failed to place Ordery',
                    data: [],
                };
            }
        }
        else {
            let saved_order_id = await this.saveOrder(order);
            order.id = saved_order_id;
            let g = await this.matchLimitOrder(order);
            if (g.success) {
                let order_list = await this.dbService.getUserOrdersNoSide(1, order.symbol, 20);
                return {
                    success: true,
                    message: 'Order placed Successfully',
                    data: order_list,
                };
            }
            else {
                return {
                    success: false,
                    message: 'Failed to place Order',
                    data: [],
                };
            }
        }
    }
    async matchLimitOrder(order) {
        if (order.side == 'BUY')
            return await this.matchBuyOrder(order);
        else
            return await this.matchSellOrder(order);
    }
    async matchMarketOrder(order) {
        if (order.side == 'BUY')
            return await this.matchMarketBuyOrder(order);
        else
            return await this.matchMarketSellOrder(order);
    }
    currentTime() {
        let u = new Date(Date.now());
        let time = u.getUTCFullYear() +
            '-' +
            ('0' + u.getUTCMonth()).slice(-2) +
            '-' +
            ('0' + u.getUTCDate()).slice(-2) +
            ' ' +
            ('0' + u.getUTCHours()).slice(-2) +
            ':' +
            ('0' + u.getUTCMinutes()).slice(-2) +
            ':' +
            ('0' + u.getUTCSeconds()).slice(-2) +
            '.' +
            (u.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5);
        return time;
    }
    async matchBuyOrder(order) {
        let is_matched = false;
        let partial = false;
        let sell_orders = this.order_books.sell_orders;
        let n = sell_orders.length;
        try {
            if (n && sell_orders[n - 1].price <= order.price) {
                for (let i = n - 1; i >= 0; i--) {
                    const sellOrder = sell_orders[i];
                    if (sellOrder.price > order.price) {
                        break;
                    }
                    console.log(` =============${i} ========`);
                    console.log('dstepff', Number(sellOrder.size), Number(order.size));
                    if (Number(sellOrder.size) >= Number(order.size)) {
                        let fills = order.fills ? JSON.parse(order.fills) : [];
                        fills.push({
                            size: order.size,
                            price: sellOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills),
                        });
                        let trade = {
                            buyer_id: order.uid,
                            seller_id: sellOrder.uid,
                            price: sellOrder.price,
                            size: order.size,
                            created_at: new Date(),
                            type: 'Limit',
                            symbol: order.symbol,
                            is_buyer: 1,
                        };
                        console.log('saving trade in here');
                        const h = await this.saveTrade(trade);
                        is_matched = true;
                        sellOrder.size -= order.size;
                        fills = sellOrder.fills ? JSON.parse(sellOrder.fills) : [];
                        fills.push({
                            size: order.size,
                            price: order.price,
                        });
                        if (Number(sellOrder.size) == 0) {
                            console.log('sellOrder.size==0');
                            await this.updateOrder(order.symbol, sellOrder.id, {
                                is_filled: true,
                                size: 0,
                                fills: JSON.stringify(fills),
                                settled_at: new Date(),
                            });
                        }
                        else {
                            console.log('fiils for sell order');
                            await this.updateOrder(order.symbol, sellOrder.id, {
                                size: sellOrder.size,
                                fills: JSON.stringify(fills),
                            });
                        }
                        break;
                    }
                    else if (Number(sellOrder.size) < Number(order.size)) {
                        console.log('(Number(sellOrder.size) < Number(order.size)');
                        let fills1 = sellOrder.fills ? JSON.parse(sellOrder.fills) : [];
                        fills1.push({
                            size: sellOrder.size,
                            price: order.price,
                        });
                        await this.updateOrder(order.symbol, sellOrder.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills1),
                        });
                        console.log('order updated to size 0');
                        let trade = {
                            buyer_id: order.uid,
                            seller_id: sellOrder.uid,
                            price: sellOrder.price,
                            size: sellOrder.size,
                            created_at: new Date(),
                            type: 'Limit',
                            symbol: order.symbol,
                            is_buyer: 0,
                        };
                        const y = await this.saveTrade(trade);
                        console.log('order trade saved second wala ');
                        partial = true;
                        order.size -= sellOrder.size;
                        console.log('sie', order.size);
                        let fills2 = order.fills ? JSON.parse(order.fills) : [];
                        fills2.push({
                            size: sellOrder.size,
                            price: sellOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            size: order.size,
                            fills: JSON.stringify(fills2),
                        });
                        console.log('order fiils updated second awla for partial fils');
                        order.fills = JSON.stringify(fills2);
                        console.log('snew orderie', order);
                        continue;
                    }
                }
            }
        }
        catch (err) {
            console.log('match limit order buy error', err);
            return { success: false, message: 'Failed to place order' };
        }
        return { success: true, message: 'Ok' };
    }
    async matchSellOrder(order) {
        let is_matched = false;
        let partial = false;
        let buy_orders = this.order_books.buy_orders;
        let partial_matches = [];
        let result = {};
        let n = buy_orders.length;
        try {
            if (n && buy_orders[n - 1].price >= order.price) {
                for (let i = n - 1; i >= 0; i--) {
                    const buyOrder = buy_orders[i];
                    if (buyOrder.price < order.price) {
                        break;
                    }
                    console.log(` =============${i} ========`);
                    console.log('dstepff', Number(buyOrder.size), Number(order.size));
                    if (Number(buyOrder.size) >= order.size) {
                        let fills = order.fills ? JSON.parse(order.fills) : [];
                        fills.push({
                            size: order.size,
                            price: order.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills),
                        });
                        let trade = {
                            buyer_id: buyOrder.uid,
                            seller_id: order.uid,
                            price: buyOrder.price,
                            size: order.size,
                            created_at: new Date(),
                            type: 'Limit',
                            symbol: order.symbol,
                            is_buyer: 0,
                        };
                        console.log('saving trade in here');
                        const h = await this.saveTrade(trade);
                        is_matched = true;
                        buyOrder.size -= order.size;
                        fills = buyOrder.fills ? JSON.parse(buyOrder.fills) : [];
                        fills.push({
                            size: order.size,
                            price: buyOrder.price,
                        });
                        if (Number(buyOrder.size) == 0) {
                            console.log('buyOrder.size==0');
                            await this.updateOrder(order.symbol, buyOrder.id, {
                                is_filled: true,
                                size: 0,
                                fills: JSON.stringify(fills),
                                settled_at: new Date(),
                            });
                        }
                        else {
                            console.log('fiils for buy order');
                            await this.updateOrder(order.symbol, buyOrder.id, {
                                size: buyOrder.size,
                                fills: JSON.stringify(fills),
                            });
                        }
                        break;
                    }
                    else if (Number(buyOrder.size) < Number(order.size)) {
                        console.log('(Number(buyOrder.size) < Number(order.size)');
                        let fills1 = buyOrder.fills ? JSON.parse(buyOrder.fills) : [];
                        fills1.push({
                            size: buyOrder.size,
                            price: order.price,
                        });
                        await this.updateOrder(order.symbol, buyOrder.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills1),
                        });
                        console.log('order updated to size 0');
                        let trade = {
                            buyer_id: buyOrder.uid,
                            seller_id: order.uid,
                            price: buyOrder.price,
                            size: buyOrder.size,
                            created_at: new Date(),
                            type: 'Limit',
                            symbol: order.symbol,
                            is_buyer: 1,
                        };
                        const y = await this.saveTrade(trade);
                        console.log('order trade saved second wala ');
                        partial = true;
                        order.size -= buyOrder.size;
                        console.log('sie', order.size);
                        let fills2 = order.fills ? JSON.parse(order.fills) : [];
                        fills2.push({
                            size: buyOrder.size,
                            price: buyOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            size: order.size,
                            fills: JSON.stringify(fills2),
                        });
                        console.log('order fiils updated second awla for partial fils');
                        order.fills = JSON.stringify(fills2);
                        console.log('snew orderie', order);
                        continue;
                    }
                }
            }
        }
        catch (err) {
            console.log('match market order sell error', err);
            return { success: false, message: 'Failed to place order' };
        }
        return { success: true, message: 'Ok' };
    }
    async fetchAllCoinOrders(userid) {
        return await this.dbService.fetchAllOrdersByUserId(userid);
    }
    async matchMarketBuyOrder(order) {
        let is_matched = false;
        let partial = false;
        let sell_orders = this.order_books.sell_orders;
        let n = sell_orders.length;
        try {
            if (n > 0) {
                for (let i = n - 1; i >= 0; i--) {
                    const sellOrder = sell_orders[i];
                    if (Number(sellOrder.size) >= Number(order.size)) {
                        let fills = order.fills ? JSON.parse(order.fills) : [];
                        fills.push({
                            size: order.size,
                            price: sellOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills),
                        });
                        let trade = {
                            buyer_id: order.uid,
                            seller_id: sellOrder.uid,
                            price: sellOrder.price,
                            size: order.size,
                            created_at: new Date(),
                            type: 'Market',
                            symbol: order.symbol,
                            is_buyer: 1,
                        };
                        console.log('saving trade in here');
                        const h = await this.saveTrade(trade);
                        is_matched = true;
                        sellOrder.size -= order.size;
                        fills = sellOrder.fills ? JSON.parse(sellOrder.fills) : [];
                        fills.push({
                            size: order.size,
                            price: sellOrder.price,
                        });
                        if (Number(sellOrder.size) == 0) {
                            console.log('sellOrder.size==0');
                            await this.updateOrder(order.symbol, sellOrder.id, {
                                is_filled: true,
                                size: 0,
                                fills: JSON.stringify(fills),
                                settled_at: new Date(),
                            });
                        }
                        else {
                            console.log('fiils for sell order');
                            await this.updateOrder(order.symbol, sellOrder.id, {
                                size: sellOrder.size,
                                fills: JSON.stringify(fills),
                            });
                        }
                        break;
                    }
                    else if (Number(sellOrder.size) < Number(order.size)) {
                        console.log('(Number(sellOrder.size) < Number(order.size)');
                        let fills1 = sellOrder.fills ? JSON.parse(sellOrder.fills) : [];
                        fills1.push({
                            size: sellOrder.size,
                            price: sellOrder.price,
                        });
                        await this.updateOrder(order.symbol, sellOrder.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills1),
                        });
                        console.log('order updated to size 0');
                        let trade = {
                            buyer_id: order.uid,
                            seller_id: sellOrder.uid,
                            price: sellOrder.price,
                            size: sellOrder.size,
                            created_at: new Date(),
                            type: 'Market',
                            symbol: order.symbol,
                            is_buyer: 0,
                        };
                        const y = await this.saveTrade(trade);
                        console.log('order trade saved second wala ');
                        partial = true;
                        order.size -= sellOrder.size;
                        console.log('sie', order.size);
                        let fills2 = order.fills ? JSON.parse(order.fills) : [];
                        fills2.push({
                            size: sellOrder.size,
                            price: sellOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            size: order.size,
                            fills: JSON.stringify(fills2),
                        });
                        console.log('order fiils updated second awla for partial fils');
                        order.fills = JSON.stringify(fills2);
                        console.log('snew orderie', order);
                        continue;
                    }
                }
            }
            else {
                return { success: false, message: 'No ordes in order book' };
            }
        }
        catch (err) {
            console.log('match market order buy error', err);
            return { success: false, message: 'Failed to place order' };
        }
        return { success: true, message: 'Ok' };
    }
    async matchMarketSellOrder(order) {
        let is_matched = false;
        let buy_orders = this.order_books.buy_orders;
        let n = buy_orders.length;
        try {
            if (n > 0) {
                for (let i = n - 1; i >= 0; i--) {
                    const buyOrder = buy_orders[i];
                    if (Number(buyOrder.size) >= Number(order.size)) {
                        let fills = order.fills ? JSON.parse(order.fills) : [];
                        fills.push({
                            size: order.size,
                            price: buyOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills),
                        });
                        let trade = {
                            buyer_id: buyOrder.uid,
                            seller_id: order.uid,
                            price: buyOrder.price,
                            size: order.size,
                            created_at: new Date(),
                            type: 'Market',
                            symbol: order.symbol,
                            is_buyer: 0,
                        };
                        console.log('saving trade in here');
                        const h = await this.saveTrade(trade);
                        is_matched = true;
                        buyOrder.size -= order.size;
                        fills = buyOrder.fills ? JSON.parse(buyOrder.fills) : [];
                        fills.push({
                            size: order.size,
                            price: buyOrder.price,
                        });
                        if (Number(buyOrder.size) == 0) {
                            console.log('sellOrder.size==0');
                            await this.updateOrder(order.symbol, buyOrder.id, {
                                is_filled: true,
                                size: 0,
                                fills: JSON.stringify(fills),
                                settled_at: new Date(),
                            });
                        }
                        else {
                            console.log('fiils for sell order');
                            await this.updateOrder(order.symbol, buyOrder.id, {
                                size: buyOrder.size,
                                fills: JSON.stringify(fills),
                            });
                        }
                        break;
                    }
                    else if (Number(buyOrder.size) < Number(order.size)) {
                        console.log('(Number(sellOrder.size) < Number(order.size)');
                        let fills1 = buyOrder.fills ? JSON.parse(buyOrder.fills) : [];
                        fills1.push({
                            size: buyOrder.size,
                            price: buyOrder.price,
                        });
                        await this.updateOrder(order.symbol, buyOrder.id, {
                            is_filled: true,
                            size: 0,
                            settled_at: new Date(),
                            fills: JSON.stringify(fills1),
                        });
                        console.log('order updated to size 0');
                        let trade = {
                            buyer_id: buyOrder.uid,
                            seller_id: order.uid,
                            price: buyOrder.price,
                            size: buyOrder.size,
                            created_at: new Date(),
                            type: 'Market',
                            symbol: order.symbol,
                            is_buyer: 0,
                        };
                        const y = await this.saveTrade(trade);
                        console.log('order trade saved second wala ');
                        order.size -= buyOrder.size;
                        console.log('sie', order.size);
                        let fills2 = order.fills ? JSON.parse(order.fills) : [];
                        fills2.push({
                            size: buyOrder.size,
                            price: buyOrder.price,
                        });
                        await this.updateOrder(order.symbol, order.id, {
                            size: order.size,
                            fills: JSON.stringify(fills2),
                        });
                        console.log('order fiils updated second awla for partial fils');
                        order.fills = JSON.stringify(fills2);
                        console.log('snew orderie', order);
                        continue;
                    }
                }
            }
            else {
                return { success: false, message: 'No ordes in order book' };
            }
        }
        catch (err) {
            console.log('match market order sell error', err);
            return { success: false, message: 'Failed to place order' };
        }
        return { success: true, message: 'Ok' };
    }
    async updateOrder(symbol, rowid, update) {
        const t = await this.dbService.updateOrderBook(rowid, update);
        let p = await this.emitSocketData(symbol);
        return;
    }
    async emitSocketData(symbol) {
        await this.fillOrderBook(symbol);
        const trades = await this.dbService.getAllTrades(symbol, 20);
        const last_24_hour_data = await this.dbService.last_24_hours_data();
        const price_before_24_hour = await this.dbService.price_before_24_hour();
        const change_in_price = trades[0].price - price_before_24_hour;
        let precentage_change = '+0%';
        if (change_in_price > 0 && price_before_24_hour > 0) {
            precentage_change =
                '+' +
                    new Intl.NumberFormat('en-IN').format((change_in_price * 100) / price_before_24_hour) +
                    '%';
        }
        else
            precentage_change =
                new Intl.NumberFormat('en-IN').format((change_in_price * 100) / price_before_24_hour) + '%';
        const resp = {
            buy_orders: this.order_books.buy_orders,
            sell_orders: this.order_books.sell_orders,
            trades: trades,
            last_trade: trades[0],
            last_24_hour_data,
            precentage_change,
            change_in_price,
        };
        this.socketServer.server.emit('message', JSON.stringify(resp));
        return;
    }
};
OrderBookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __param(1, (0, common_1.Inject)(socket_gateway_1.SocketGateway)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        socket_gateway_1.SocketGateway])
], OrderBookService);
exports.OrderBookService = OrderBookService;
//# sourceMappingURL=order-book.service.js.map