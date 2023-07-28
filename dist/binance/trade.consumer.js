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
exports.TradeConsumer = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
let TradeConsumer = class TradeConsumer {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async processTrade(job) {
        let row = job.data.item;
        const order = await this.dbService.getOrderFromTable(row['orderId'], row['clientId']);
        if (order != null && order['status'] != 'FILLED') {
            await this.dbService.updateBinanceTrade(row['clientId'], row['side'], row['type'], row['current_status'], row['symbol'], row['orderId'], row['date'], row['quantity'], row['settled_price']);
            let coin = row['symbol'].substr(0, row['symbol'].indexOf('USDT'));
            let network = 'BEP20';
            if (coin == 'BNB' || coin == 'DRNH' || coin == 'USDT')
                network = 'BEP20';
            else if (coin == 'ETH')
                network = 'Ethereum';
            else if (coin == 'BTC')
                network = 'Bitcoin';
            let main_column = coin.toLowerCase() + '_balance';
            console.log('==================workign on job queue========');
            if (row['side'] == 'BUY') {
                let usdt_to_deduct = row['cummulativeQuoteQty'];
                let q = "UPDATE tbl_wallet SET `" + main_column + "`=`" + main_column + "`+" + row['quantity'] + " ,`usdt_balance` =`usdt_balance`-" + usdt_to_deduct + " WHERE `user_id`='" + order['user_id'] + "' AND `network`='" + network + "'";
                console.log('consumer buy query', q);
                await this.dbService.updateWalletQuery(q);
            }
            else {
                let usdt_to_add = row['cummulativeQuoteQty'];
                let q = "UPDATE tbl_wallet SET `" + main_column + "`=`" + main_column + "`-" + row['quantity'] + " ,`usdt_balance` =`usdt_balance`+" + usdt_to_add + " WHERE `user_id`='" + order['user_id'] + "' AND `network`='" + network + "'";
                console.log('consumter sell query', q);
                await this.dbService.updateWalletQuery(q);
            }
        }
    }
};
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TradeConsumer.prototype, "processTrade", null);
TradeConsumer = __decorate([
    (0, bull_1.Processor)('trade_queue'),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], TradeConsumer);
exports.TradeConsumer = TradeConsumer;
//# sourceMappingURL=trade.consumer.js.map