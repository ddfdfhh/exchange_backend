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
exports.DepositConsumer = void 0;
const bull_1 = require("@nestjs/bull");
const web3_service_1 = require("./web3.service");
const common_1 = require("@nestjs/common");
const database_service_1 = require("../database/database.service");
const withdrawal_entity_1 = require("../database/withdrawal_entity/withdrawal.entity");
const user_entity_1 = require("../database/user/user.entity");
let DepositConsumer = class DepositConsumer {
    constructor(web3Service, dbService) {
        this.web3Service = web3Service;
        this.dbService = dbService;
    }
    async processDeposit(job) {
        let pendingDeposits = job.data.pendingDeposits;
        pendingDeposits.forEach(async (v) => {
            console.log('started looping pendingDeposits', v);
            try {
                let transaction = await this.web3Service.findTransactionForDeposit(v.to_address, v.amount, v.coin, v.network, v.start_block);
                console.log('found transaction', transaction);
                if (transaction) {
                    let update_data = {
                        status: transaction.txreceipt_status
                            ? withdrawal_entity_1.Status.Approved
                            : withdrawal_entity_1.Status.Reverted,
                        reason: transaction.txreceipt_status == 1
                            ? ''
                            : 'Reverted transaction',
                        confirmations: transaction.confirmations,
                        from_address: transaction.from,
                        transaction_hash: transaction.hash,
                        response: JSON.stringify({
                            gasUsed: transaction.gasUsed,
                            block_hash: transaction.blockHash,
                            time: Date.now(),
                        }, (key, value) => typeof value === 'bigint' ? value.toString() : value),
                        updated_at: new Date(),
                    };
                    if (typeof transaction == 'bigint' || typeof transaction == 'number')
                        await this.updateDepositConfirmationCount(v.id, transaction);
                    else {
                        await this.updateDepositlWithStatus(v, update_data);
                    }
                }
                else {
                    let diff = (new Date().getTime() - new Date(v.created_at).getTime()) / 1000;
                    diff /= 60 * 60;
                    const diffin_hrs = Math.abs(Math.round(diff));
                    if (diffin_hrs >= 6) {
                        await this.dbService.updateDepositById(v.id, { deleted: user_entity_1.YesNo.YES });
                    }
                }
            }
            catch (error) {
                await this.dbService.saveError({
                    error: error,
                    from: 'Looping throug despit in deposit consumer file',
                });
            }
        });
    }
    async updateDepositConfirmationCount(id, count) {
        await this.dbService.updateWtihdrawalById(id, {
            confirmations: parseInt(String(count)),
        });
    }
    async updateDepositlWithStatus(deposit, update_data) {
        let g = await this.dbService.updateDepositById(deposit.id, update_data);
        if (update_data.status == withdrawal_entity_1.Status.Approved) {
            await this.dbService.updateWallet(deposit.user_id, deposit.amount, deposit.to_address, deposit.coin, deposit.network, 'inc');
            await this.dbService.saveTokenAddressBalance(deposit.to_address, deposit.coin, deposit.network, deposit.amount, 'Inc');
        }
    }
};
__decorate([
    (0, bull_1.Process)({ concurrency: 3 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DepositConsumer.prototype, "processDeposit", null);
DepositConsumer = __decorate([
    (0, bull_1.Processor)('deposit_queue'),
    __param(0, (0, common_1.Inject)(web3_service_1.Web3Service)),
    __param(1, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [web3_service_1.Web3Service,
        database_service_1.DatabaseService])
], DepositConsumer);
exports.DepositConsumer = DepositConsumer;
//# sourceMappingURL=deposit.consumer.js.map