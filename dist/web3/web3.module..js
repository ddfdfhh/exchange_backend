"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3Module = void 0;
const common_1 = require("@nestjs/common");
const web3_1 = require("web3");
const web3_service_1 = require("./web3.service");
const queue_provider_1 = require("./queue.provider");
const bull_1 = require("@nestjs/bull");
const withdrawal_consumer_1 = require("./withdrawal.consumer");
const database_module_1 = require("../database/database.module");
const axios_1 = require("@nestjs/axios");
let Web3Module = class Web3Module {
};
Web3Module = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            bull_1.BullModule.registerQueue({
                name: 'withdrawal_queue',
            }, {
                name: 'deposit_queue',
            }),
            database_module_1.DatabaseModule,
        ],
        providers: [
            {
                provide: 'Web3',
                useValue: new web3_1.default(new web3_1.default.providers.HttpProvider('https://data-seed-prebsc-1-s2.binance.org:8545')),
            },
            {
                provide: 'EthWeb3',
                useValue: new web3_1.default(new web3_1.default.providers.HttpProvider('https://sepolia.infura.io/v3/55739af7e34c455ba6d78e039362c4a5')),
            },
            web3_service_1.Web3Service,
            queue_provider_1.QueueService,
            withdrawal_consumer_1.WithdrawalConsumer,
        ],
        exports: [web3_service_1.Web3Service, queue_provider_1.QueueService],
    })
], Web3Module);
exports.Web3Module = Web3Module;
//# sourceMappingURL=web3.module..js.map