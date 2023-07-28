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
exports.WithdrawalConsumer = void 0;
const bull_1 = require("@nestjs/bull");
const web3_service_1 = require("./web3.service");
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const withdrawal_entity_1 = require("../database/withdrawal_entity/withdrawal.entity");
let WithdrawalConsumer = class WithdrawalConsumer {
    constructor(web3Service, dbService) {
        this.web3Service = web3Service;
        this.dbService = dbService;
    }
    async processWithdrawal(job) {
        let pendingWithdrawals = job.data.pendingWithdrawals;
        pendingWithdrawals.forEach(async (v) => {
            console.log('started looping');
            try {
                let receipt = await this.web3Service.receipt(v.transaction_hash, v.from_address, v.network);
                console.log('receipt got');
                if (receipt) {
                    let update_data = (typeof receipt == 'bigint' || typeof receipt == 'number')
                        ? { confirmations: parseInt(String(receipt)) }
                        : {
                            status: receipt.status ? withdrawal_entity_1.Status.Approved : withdrawal_entity_1.Status.Reverted,
                            reason: receipt.status == 1 ? '' : 'Reverted transaction',
                            confirmations: receipt.confirmationCount,
                            response: JSON.stringify({
                                gasUsed: receipt.gasUsed,
                                block_hash: receipt.blockHash,
                                to: receipt.to,
                                from: receipt.from,
                                time: Date.now(),
                            }, (key, value) => typeof value === 'bigint' ? value.toString() : value),
                            updated_at: new Date(),
                        };
                    await this.dbService.updateWtihdrawalById(v.id, update_data);
                }
            }
            catch (error) {
                await this.dbService.saveError({ error: error, from: 'Looping throug get receipt' });
            }
        });
    }
    async updateWithdrawlConfirmationCount(id, count) {
        let g = await this.dbService.updateWtihdrawalById(id, { confirmations: parseInt(String(count)) });
    }
    async updateWithdrawlWithStatus(withdrawal, update_data) {
        let g = await this.dbService.updateWtihdrawalById(withdrawal.id, update_data);
        if (update_data.status == withdrawal_entity_1.Status.Approved) {
            this.dbService.updateWallet(withdrawal.user_id, withdrawal.with_amount, withdrawal.from_address, withdrawal.coin, withdrawal.network, 'Dec');
            await this.dbService.saveTokenAddressBalance(withdrawal.from_address, withdrawal.coin, withdrawal.network, withdrawal.with_amount + 0.0001, 'Dec');
        }
    }
    onActive(job) {
    }
    onProgress(job, progress) {
        console.log('Proceress. ' + progress);
    }
    onCompleted(job, result) {
    }
};
__decorate([
    (0, bull_1.Process)({ concurrency: 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WithdrawalConsumer.prototype, "processWithdrawal", null);
__decorate([
    (0, bull_1.OnQueueActive)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WithdrawalConsumer.prototype, "onActive", null);
__decorate([
    (0, bull_1.OnQueueProgress)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", void 0)
], WithdrawalConsumer.prototype, "onProgress", null);
__decorate([
    (0, bull_1.OnQueueCompleted)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], WithdrawalConsumer.prototype, "onCompleted", null);
WithdrawalConsumer = __decorate([
    (0, bull_1.Processor)('withdrawal_queue'),
    __param(0, (0, common_1.Inject)(web3_service_1.Web3Service)),
    __param(1, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        database_service_1.DatabaseService])
], WithdrawalConsumer);
exports.WithdrawalConsumer = WithdrawalConsumer;
//# sourceMappingURL=withdrawal.consumer.js.map