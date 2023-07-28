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
exports.BinanceController = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const database_service_1 = require("../database/database.service");
const WebSocket = require("ws");
const trade_queue_service_1 = require("./trade_queue.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let ws;
const { Spot } = require('@binance/connector');
const uniqid = require('uniqid');
const APIKEY = 'BFMpFC9ugkS3Q8tC8wzmgJb88GSxpka78dQpJAVWZZ3cY8JWIHedS2HYfH4WUJWv';
const APISECRET = 'C0upI2cDeZN4rlDHxb1bEk5oKx021wjQAfCP241KwsYkBTOeLfHXypyRFlKGlJcO';
const binance_testnet_url = 'https://testnet.binance.vision/';
const binance_main_url = 'https://api.binance.com/';
const base_url = binance_testnet_url;
const client = new Spot(APIKEY, APISECRET, { baseURL: base_url });
let arr_events_msg = [];
let BinanceController = class BinanceController {
    constructor(dbService, tradeQueueService) {
        this.dbService = dbService;
        this.tradeQueueService = tradeQueueService;
    }
    async checkAdminWalletBalance(main_currency, secondary_currency, side, qty, price, avgPrice, type) {
        console.log('avgprice', avgPrice);
        console.log('qty', qty);
        let balance_data = await client.account();
        let balances = balance_data.data['balances'];
        let secondary_currency_amount_to_compare = type == 'LIMIT' ? Number(qty * price) : Number(qty * avgPrice);
        console.log('balances', balances);
        console.log('seconda_c', secondary_currency);
        let main_balance_data = balances.find((v) => {
            return v['asset'] == main_currency;
        });
        console.log('main_baln', main_balance_data);
        let main_balance = main_balance_data['free'];
        let secondary_balance_data = balances.find((v) => {
            return v['asset'] == secondary_currency;
        });
        let secondary_balance = secondary_balance_data['free'];
        if (side == 'BUY') {
            if (Number(secondary_balance) < secondary_currency_amount_to_compare)
                return {
                    success: false,
                    message: `Insufficient ${secondary_currency} balance`,
                };
        }
        else {
            if (main_balance < qty) {
                return { success: false, message: `Insufficient ${main_currency} balance` };
            }
        }
        return {
            success: true,
            message: ``,
        };
    }
    async getOrderPromise(price = undefined, qty, type, symbol, side, newClientOrderId) {
        return price != undefined && type == 'LIMIT'
            ? await client.newOrder(symbol, side, type, {
                price: price,
                quantity: qty,
                timeInForce: 'GTC',
                newClientOrderId,
            })
            : await client.newOrder(symbol, side, type, {
                quantity: qty,
                newClientOrderId,
            });
    }
    async placeOrder(req, req1) {
        let is_error = false;
        const last_time = await this.dbService.lastUpdatedTimeListener();
        const timediffInSeconds = Math.abs(new Date().getTime() - new Date(last_time).getTime()) / 1000;
        if (timediffInSeconds > 3000 || ws === undefined) {
            console.log('==========subcribing lisnter');
            let rs = await this.subscribeListener();
            if (ws.readyState !== ws.OPEN || !rs['success']) {
                try {
                    await this.waitForOpenConnection(ws);
                }
                catch (err) {
                    return this.handleError(err, 'From socket connection', 'Failed to open socket connection');
                }
            }
            console.log('===============subcribing done');
        }
        let price = (req['price'] !== undefined || req['price'] == null) ? parseFloat(req['price']) : null;
        let symbol = req['symbol'];
        let side = req['side'];
        let qty = parseFloat(req['quantity']);
        let type = req['type'];
        let main_currency = req['main_currency'];
        let secondary_currency = req['secondary_currency'];
        let userId = req1.user['userId'];
        let newClientOrderId = uniqid();
        let currentAvgPrice;
        try {
            console.log('===========Avergage price getting  ');
            let currentAvgPriceQuery = await axios_1.default.get(base_url + 'api/v3/avgPrice?symbol=' + symbol);
            currentAvgPrice = currentAvgPriceQuery.data['price'];
            console.log('===========Avergage price done  ' + currentAvgPrice);
        }
        catch (err) {
            is_error = err;
        }
        if (is_error)
            return this.handleError(is_error, 'From avg price', 'Failed To fetch avg price');
        is_error = false;
        console.log('============checking balance ');
        let res = await this.checkAdminWalletBalance(main_currency, secondary_currency, side, qty, price, currentAvgPrice, type);
        if (!res['success'])
            return { success: false, message: res['message'] };
        console.log('============checking balance done ');
        if (qty < 0) {
            return {
                success: false,
                message: 'Quantity can not be zero or less',
            };
        }
        let orderResponse;
        try {
            console.log('==========Placing order');
            if (type == 'LIMIT') {
                let orderQuery = await this.getOrderPromise(price, qty, 'LIMIT', symbol, side, newClientOrderId);
                orderResponse = orderQuery.data;
            }
            else {
                let orderQuery = await this.getOrderPromise(undefined, qty, 'MARKET', symbol, side, newClientOrderId);
                orderResponse = orderQuery.data;
            }
            console.log('=====order responsed');
            console.log('==========Databse inserting order');
            await this.dbService.insertInBinanceTradeTablensertInB(userId, orderResponse['clientOrderId'], orderResponse['price'], orderResponse['origQty'], orderResponse['executedQty'], orderResponse['side'], orderResponse['type'], orderResponse['status'], JSON.stringify(orderResponse['fills']), orderResponse['symbol'], orderResponse['orderId'], orderResponse['cummulativeQuoteQty'], orderResponse['fills'][0]['price']);
            console.log('==========Databse inserting done');
            if (orderResponse['status'] == 'FILLED' ||
                orderResponse['status'] == 'PARTIALLY_FILLED') {
                console.log('==========updating wallet if filled');
                let coin = orderResponse['symbol'].substr(0, orderResponse['symbol'].indexOf('USDT'));
                let network = 'BEP20';
                if (coin == 'BNB' || coin == 'DRNH' || coin == 'USDT')
                    network = 'BEP20';
                else if (coin == 'ETH')
                    network = 'Ethereum';
                else if (coin == 'BTC')
                    network = 'Bitcoin';
                let main_column = coin.toLowerCase() + '_balance';
                if (orderResponse['side'] == 'BUY') {
                    let usdt_to_deduct = orderResponse['cummulativeQuoteQty'];
                    console.log('usdt changes', usdt_to_deduct);
                    let q = `UPDATE tbl_wallet SET \`${main_column}\`=\`${main_column}\`+${orderResponse['executedQty']} ,\`usdt_balance\` =\`usdt_balance\`-${usdt_to_deduct} WHERE \`user_id\`='${userId}' AND \`network\`='${network}'`;
                    console.log('contrller buy query', q);
                    await this.dbService.updateWalletQuery(q);
                }
                else {
                    let usdt_to_add = orderResponse['cummulativeQuoteQty'];
                    console.log('usdt changes add', usdt_to_add);
                    let q = `UPDATE tbl_wallet SET \`${main_column}\`=\`${main_column}\`-${orderResponse['executedQty']} ,\`usdt_balance\` =\`usdt_balance\`+${usdt_to_add} WHERE \`user_id\`='${userId}' AND \`network\`='${network}'`;
                    console.log('cotrller sell query', q);
                    await this.dbService.updateWalletQuery(q);
                }
            }
            let allOrders = await this.dbService.getAllUserOrderFromTable(userId);
            return {
                success: true,
                message: 'Order Placed Succesfully',
                data: allOrders,
            };
        }
        catch (err) {
            console.log('err', err);
            return this.handleError(err, 'From order place', 'Failed To place Order');
        }
    }
    async subscribeListener() {
        try {
            let listenerQuery = await axios_1.default.post(base_url + 'api/v3/userDataStream', null, {
                headers: {
                    'X-MBX-APIKEY': APIKEY,
                },
            });
            let key = listenerQuery.data.listenKey;
            await this.dbService.updateListenerTime();
            if (ws !== undefined && ws.readyState === WebSocket.CLOSED)
                ws = new WebSocket('wss://testnet.binance.vision/ws/' + key);
            if (ws == undefined)
                ws = new WebSocket('wss://testnet.binance.vision/ws/' + key);
            ws.onopen = (e) => {
                console.log('socket opened');
            };
            ws.onmessage = async (event) => {
                const eventInfo = JSON.parse(event.data);
                if (eventInfo['e'] == 'executionReport') {
                    let item = {
                        date: eventInfo['E'],
                        orderId: eventInfo['i'],
                        clientId: eventInfo['c'],
                        price: eventInfo['p'],
                        quantity: eventInfo['q'],
                        side: eventInfo['S'],
                        type: eventInfo['o'],
                        symbol: eventInfo['s'],
                        current_status: eventInfo['X'],
                        cummulativeQuoteQty: eventInfo['Z'],
                        settled_price: eventInfo['0'] == 'LIMIT' ? eventInfo['p'] : eventInfo['L'],
                    };
                    console.log('events', eventInfo);
                    if (eventInfo['x'] == 'TRADE' && eventInfo['x'] != 'FILLED') {
                        await this.dbService.insertEventData(item['clientId'], item, eventInfo);
                        await this.tradeQueueService.initiateTradeJob(item);
                    }
                    else {
                        console.log('=======================');
                        await this.dbService.insertEventData(item['clientId'], item, eventInfo);
                        console.log('items', item);
                    }
                }
            };
            return { success: true, message: 'ok' };
        }
        catch (err) {
            return { success: false, message: err.toString().substring(0, 50) };
        }
    }
    waitForOpenConnection(socket) {
        return new Promise((resolve, reject) => {
            const maxNumberOfAttempts = 15;
            const intervalTime = 200;
            let currentAttempt = 0;
            const interval = setInterval(() => {
                console.log('tryign websocket connectio', currentAttempt);
                if (currentAttempt > maxNumberOfAttempts - 1) {
                    clearInterval(interval);
                    reject(new Error('Maximum number of attempts exceeded'));
                }
                else if (socket.readyState === socket.OPEN) {
                    clearInterval(interval);
                    resolve();
                }
                currentAttempt++;
            }, intervalTime);
        });
    }
    handleError(err, from = '', msg = '') {
        if (!err.isAxiosError) {
            let part = err.toString().substr(0, 50);
            if (part.includes('ETIMEDOUT')) {
                console.log('timedout from ' + from);
                return {
                    success: false,
                    message: 'Connection Timeout ocurred ,please try again',
                };
            }
            else {
                console.log(msg);
                return { success: false, message: msg };
            }
        }
        else {
            console.log('Errror from', from);
            return { success: false, message: msg };
        }
    }
    async getOrderStatus(req) {
        let orderId = req['orderId'];
        try {
            const reps = await client.getOrder('BNBUSDT', { orderId });
            console.log(reps.data);
        }
        catch (er) {
            console.log('error', er);
        }
    }
    async getBalance() {
        let main_currency = 'BNB';
        let secondary_currency = 'USDT';
        let balance_data = await client.account();
        let balances = balance_data.data['balances'];
        console.log('balances', balances);
        let main_balance_data = balances.filter((v) => {
            return v['asset'] == main_currency;
        });
        let main_balance = main_balance_data[0]['free'];
        let secondary_balance_data = balances.filter((v) => {
            return v['asset'] == secondary_currency;
        });
        let secondary_balance = secondary_balance_data[0]['free'];
        console.log('main balcnce dataa', main_balance);
        console.log('secondary balcnce dataa', secondary_balance);
    }
    async getUserOrders(req) {
        let list = await this.dbService.getAllUserOrderFromTable(req.user.userId);
        return { success: true, message: '', data: list };
    }
    async cancelOrder(req) {
        const symbol = req['symbol'];
        const orderId = req['orderId'];
        const userId = req['user_id'];
        try {
            const resp = await client.cancelOrder(symbol, { orderId: orderId });
            await this.dbService.deleteOrder(orderId, userId);
            return {
                success: true,
                message: 'Cancelled successfully',
                data: resp.data,
            };
        }
        catch (err) {
            this.handleError(err, 'Cancel Order', 'Faild to cancel order');
        }
    }
    async allOrders(req) {
        const symbol = req['symbol'];
        try {
            const resp = await client.openOrders(symbol);
            return {
                success: true,
                message: 'Fetched successfully',
                data: resp.data,
            };
        }
        catch (err) {
            this.handleError(err, 'All Order', 'Faild to fetch all orders');
        }
    }
    async fetchBalanceFromTable(post, req) {
        const symbol = post['coin'];
        const network = post['network'];
        const userId = req.user.userId;
        try {
            const resp = await this.dbService.searchAddress(userId, network);
            return {
                success: true,
                message: 'Balance Fetched successfully',
                data: { main_balance: resp[symbol.toLowerCase() + '_balance'], usdt_balance: resp['usdt_balance'] },
            };
        }
        catch (err) {
            this.handleError(err, 'Table Balance Fetch', 'Faild to fetch taable balance');
        }
    }
};
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('placeOrder'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "placeOrder", null);
__decorate([
    (0, common_1.Post)('orderStatus'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "getOrderStatus", null);
__decorate([
    (0, common_1.Get)('balance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "getBalance", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('allUserOrders'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "getUserOrders", null);
__decorate([
    (0, common_1.Post)('cancelOrder'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "cancelOrder", null);
__decorate([
    (0, common_1.Post)('AllOrders'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "allOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('fetchBalanceFromTable'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BinanceController.prototype, "fetchBalanceFromTable", null);
BinanceController = __decorate([
    (0, common_1.Controller)('binance'),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __param(1, (0, common_1.Inject)(trade_queue_service_1.TradeQueueService)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        trade_queue_service_1.TradeQueueService])
], BinanceController);
exports.BinanceController = BinanceController;
//# sourceMappingURL=binance.controller.js.map