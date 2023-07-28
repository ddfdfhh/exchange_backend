"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BinanceModule = void 0;
const common_1 = require("@nestjs/common");
const binance_controller_1 = require("./binance.controller");
const database_module_1 = require("../database/database.module");
const bull_1 = require("@nestjs/bull");
const trade_queue_service_1 = require("./trade_queue.service");
const trade_consumer_1 = require("./trade.consumer");
let BinanceModule = class BinanceModule {
};
BinanceModule = __decorate([
    (0, common_1.Module)({
        controllers: [binance_controller_1.BinanceController],
        imports: [
            database_module_1.DatabaseModule,
            bull_1.BullModule.registerQueue({
                name: 'trade_queue',
            }),
        ],
        providers: [trade_queue_service_1.TradeQueueService, trade_consumer_1.TradeConsumer]
    })
], BinanceModule);
exports.BinanceModule = BinanceModule;
//# sourceMappingURL=binance.module.js.map