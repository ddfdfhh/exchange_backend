"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const trade_entity_1 = require("./trade/trade.entity");
const order_book_entity_1 = require("./order_book/order_book.entity");
const database_service_1 = require("./database.service");
const user_entity_1 = require("./user/user.entity");
const wallet_entity_1 = require("./wallet/wallet.entity");
const identity_entity_1 = require("./identity/identity.entity");
const network_fees_entity_1 = require("./network_fees/network_fees.entity");
const withdrawal_entity_1 = require("./withdrawal_entity/withdrawal.entity");
const error_handling_entity_1 = require("./error_handling.entity");
const deposit_entity_1 = require("./deposit_entity/deposit.entity");
const address_balance_entity_1 = require("./address_balance.entity");
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                trade_entity_1.Trade,
                order_book_entity_1.OrderBook,
                user_entity_1.User,
                wallet_entity_1.Wallet,
                identity_entity_1.Identity,
                network_fees_entity_1.NetworkFee,
                withdrawal_entity_1.Withdrawal,
                error_handling_entity_1.ErrorSave,
                deposit_entity_1.Deposit,
                address_balance_entity_1.TokenAddressBalance
            ]),
        ],
        providers: [database_service_1.DatabaseService],
        exports: [database_service_1.DatabaseService],
    })
], DatabaseModule);
exports.DatabaseModule = DatabaseModule;
//# sourceMappingURL=database.module.js.map