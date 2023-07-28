"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const socket_module_1 = require("./socket/socket.module");
const trade_entity_1 = require("./database/trade/trade.entity");
const typeorm_1 = require("@nestjs/typeorm");
const order_book_entity_1 = require("./database/order_book/order_book.entity");
const order_book_module_1 = require("./order-book/order-book.module");
const database_module_1 = require("./database/database.module");
const wallet_module_1 = require("./wallet/wallet.module");
const auth_module_1 = require("./auth/auth.module");
const user_entity_1 = require("./database/user/user.entity");
const wallet_entity_1 = require("./database/wallet/wallet.entity");
const identity_entity_1 = require("./database/identity/identity.entity");
const network_fees_entity_1 = require("./database/network_fees/network_fees.entity");
const withdrawal_entity_1 = require("./database/withdrawal_entity/withdrawal.entity");
const web3_module_1 = require("./web3/web3.module.");
const bull_1 = require("@nestjs/bull");
const nest_winston_1 = require("nest-winston");
const schedule_1 = require("@nestjs/schedule");
const winston = require("winston");
const cron_module_1 = require("./cron/cron.module");
const deposit_entity_1 = require("./database/deposit_entity/deposit.entity");
const address_balance_entity_1 = require("./database/address_balance.entity");
const typeorm_2 = require("typeorm");
const binance_module_1 = require("./binance/binance.module");
var path = require('path');
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            cron_module_1.CronModule,
            socket_module_1.SocketModule,
            auth_module_1.AuthModule,
            nest_winston_1.WinstonModule.forRoot({
                format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
                transports: [
                    new winston.transports.Console(),
                    new winston.transports.File({
                        dirname: path.join(__dirname, './../log/debug/'),
                        filename: 'debug.log',
                        level: 'debug',
                    }),
                    new winston.transports.File({
                        dirname: path.join(__dirname, './../log/info/'),
                        filename: 'info.log',
                        level: 'info',
                    }),
                ],
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'mysql',
                    host: 'db-crypto-exchange.cdw9z07jl5zt.ap-south-1.rds.amazonaws.com',
                    port: 3306,
                    username: 'db_crypto',
                    password: 'Shivbaba123456#',
                    database: 'trading',
                    entities: [
                        trade_entity_1.Trade,
                        order_book_entity_1.OrderBook,
                        user_entity_1.User,
                        wallet_entity_1.Wallet,
                        identity_entity_1.Identity,
                        network_fees_entity_1.NetworkFee,
                        withdrawal_entity_1.Withdrawal,
                        deposit_entity_1.Deposit,
                        address_balance_entity_1.TokenAddressBalance,
                    ],
                    synchronize: true,
                }),
                dataSourceFactory: async (options) => {
                    const dataSource = await new typeorm_2.DataSource(options).initialize();
                    return dataSource;
                },
            }),
            bull_1.BullModule.forRoot({
                redis: {
                    host: 'redis-14582.c305.ap-south-1-1.ec2.cloud.redislabs.com',
                    port: 14582,
                    password: 'ZrvLwcxPj0biXStChbLnsLDI4w6kwOdq',
                },
            }),
            order_book_module_1.OrderBookModule,
            wallet_module_1.WalletModule,
            auth_module_1.AuthModule,
            database_module_1.DatabaseModule,
            web3_module_1.Web3Module,
            binance_module_1.BinanceModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map