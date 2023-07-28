"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderBookModule = void 0;
const common_1 = require("@nestjs/common");
const database_module_1 = require("../database/database.module");
const order_book_service_1 = require("./order-book.service");
const order_book_controller_1 = require("./order-book.controller");
const socket_module_1 = require("../socket/socket.module");
let OrderBookModule = class OrderBookModule {
};
OrderBookModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, socket_module_1.SocketModule],
        providers: [order_book_service_1.OrderBookService],
        controllers: [order_book_controller_1.OrderBookController],
        exports: [order_book_service_1.OrderBookService],
    })
], OrderBookModule);
exports.OrderBookModule = OrderBookModule;
//# sourceMappingURL=order-book.module.js.map