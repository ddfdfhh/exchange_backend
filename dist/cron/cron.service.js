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
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const queue_provider_1 = require("../web3/queue.provider");
let CronService = class CronService {
    constructor(queueService) {
        this.queueService = queueService;
    }
    async handleWithdrawalCron() {
        console.log('running cron every withdral');
        await this.queueService.initiateWithdrawalJob();
    }
    async handleDepositCron() {
        console.log('running cron every 4');
        await this.queueService.initiateDepositJob();
    }
};
__decorate([
    (0, schedule_1.Cron)('*/2 * * * * *', {
        name: 'withdrawal_cron',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "handleWithdrawalCron", null);
__decorate([
    (0, schedule_1.Cron)('*/2 * * * * *', {
        name: 'deposit_cron',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "handleDepositCron", null);
CronService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(queue_provider_1.QueueService)),
    __metadata("design:paramtypes", [queue_provider_1.QueueService])
], CronService);
exports.CronService = CronService;
//# sourceMappingURL=cron.service.js.map