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
exports.SocketGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const database_service_1 = require("../database/database.service");
let SocketGateway = class SocketGateway {
    constructor(dbService) {
        this.dbService = dbService;
    }
    listenForMessages(data) {
        this.server.sockets.emit('receive_message', data);
    }
    async listenForOrder(client, payload) {
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
                        new Intl.NumberFormat('en-IN').format((change_in_price * 100) / price_before_24_hour) +
                        '%';
            }
            else
                precentage_change =
                    new Intl.NumberFormat('en-IN').format((change_in_price * 100) / price_before_24_hour) + '%';
        }
        else
            precentage_change = '0';
        const resp = {
            buy_orders: buy_orders,
            sell_orders: sell_orders,
            trades: trades,
            last_trade: trades[0],
            last_24_hour_data,
            precentage_change,
            change_in_price,
        };
        this.server.sockets.emit('message', JSON.stringify(resp));
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('send_message'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SocketGateway.prototype, "listenForMessages", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('get_data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "listenForOrder", null);
SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], SocketGateway);
exports.SocketGateway = SocketGateway;
//# sourceMappingURL=socket.gateway.js.map