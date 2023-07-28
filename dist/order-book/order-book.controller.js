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
exports.OrderBookController = void 0;
const common_1 = require("@nestjs/common");
const order_book_service_1 = require("./order-book.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let OrderBookController = class OrderBookController {
    constructor(bookService) {
        this.bookService = bookService;
    }
    async getAllOrders(post, req) {
        const user_id = req.user.userId;
        const list = await this.bookService.getAllOrders(user_id, post.symbol, post.limit);
        return { success: true, message: 'fetched', data: list };
    }
    async create(createOrderDto, req) {
        if (req.user != undefined && req.user.userId !== undefined) {
            const resp = await this.bookService.handleOrder(Object.assign({ uid: req.user.userId, type: 'Limit' }, createOrderDto));
            return resp;
        }
        else
            return { success: false, message: 'Please login ' };
    }
    async createMarket(createOrderDto, req) {
        if (req.user != undefined && req.user.userId !== undefined) {
            const resp = await this.bookService.handleOrder(Object.assign({ type: 'Market' }, createOrderDto));
            return resp;
        }
        else
            return { success: false, message: 'Please login ' };
    }
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
    async fetchAllCoinOrders(req) {
        const data = await this.bookService.fetchAllCoinOrders(req.user.userId);
        return { success: true, message: '', data };
    }
};
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('userOrders'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderBookController.prototype, "getAllOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create/Limit'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderBookController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('create/Market'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrderBookController.prototype, "createMarket", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OrderBookController.prototype, "fetchOrders", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('fetchAllCoinOrders'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderBookController.prototype, "fetchAllCoinOrders", null);
OrderBookController = __decorate([
    (0, common_1.Controller)('orderbooks'),
    __param(0, (0, common_1.Inject)(order_book_service_1.OrderBookService)),
    __metadata("design:paramtypes", [order_book_service_1.OrderBookService])
], OrderBookController);
exports.OrderBookController = OrderBookController;
//# sourceMappingURL=order-book.controller.js.map