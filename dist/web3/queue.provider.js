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
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const database_service_1 = require("../database/database.service");
const schedule_1 = require("@nestjs/schedule");
let QueueService = class QueueService {
    constructor(wQueue, dQueue, dbService, schedulerRegistry) {
        this.wQueue = wQueue;
        this.dQueue = dQueue;
        this.dbService = dbService;
        this.schedulerRegistry = schedulerRegistry;
        this.withdrawal_job = null;
        this.deposit_job = null;
    }
    async initiateWithdrawalJob() {
        const options = { removeOnComplete: true };
        const pendingWithdrawals = await this.dbService.getPendingWithdrawal();
        console.log('list', pendingWithdrawals.length);
        if (pendingWithdrawals.length > 0) {
            if (!this.withdrawal_job) {
                this.withdrawal_job = await this.wQueue.add({ pendingWithdrawals }, options);
                this.withdrawal_job.finished().then((v) => {
                    console.log('finished job', this.withdrawal_job.id);
                    this.withdrawal_job = null;
                });
            }
            else
                console.log('wait then to add to q', this.withdrawal_job.id);
        }
        else {
            this.withdrawal_job = null;
            const pl = this.schedulerRegistry.getCronJob('withdrawal_cron');
            console.log('withdrawal_cron cron closed');
            pl.stop();
        }
    }
    async initiateDepositJob() {
        const options = { removeOnComplete: true };
        const pendingDeposits = await this.dbService.getPendingDeposits();
        console.log('deposit list', pendingDeposits.length);
        const start_time = new Date().getTime();
        if (pendingDeposits.length > 0) {
            if (!this.deposit_job) {
                this.deposit_job = await this.dQueue.add({ pendingDeposits }, options);
                this.deposit_job.finished().then((v) => {
                    console.log('deposit finished job', this.deposit_job.id);
                    this.deposit_job = null;
                });
            }
            else
                console.log('wait then to add to q', this.deposit_job.id);
        }
        else {
            this.deposit_job = null;
            const pl = this.schedulerRegistry.getCronJob('deposit_cron');
            console.log('deposit cron closed');
            pl.stop();
        }
    }
};
QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('withdrawal_queue')),
    __param(1, (0, bull_1.InjectQueue)('deposit_queue')),
    __param(2, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __metadata("design:paramtypes", [Object, Object, database_service_1.DatabaseService,
        schedule_1.SchedulerRegistry])
], QueueService);
exports.QueueService = QueueService;
//# sourceMappingURL=queue.provider.js.map