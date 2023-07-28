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
exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./database/database.service");
const withdrawal_entity_1 = require("./database/withdrawal_entity/withdrawal.entity");
const web3_service_1 = require("./web3/web3.service");
const queue_provider_1 = require("./web3/queue.provider");
let AppController = class AppController {
    constructor(dbService, web3Service, queueService) {
        this.dbService = dbService;
        this.web3Service = web3Service;
        this.queueService = queueService;
    }
    async first() {
        return 'ok';
    }
    hook(obj) {
        if (obj['block_hash'] !== undefined &&
            obj['block_height'] > 0 &&
            obj['confirmations'] > 0) {
            console.log('souccess hook', obj);
            try {
                let p = this.dbService.updateWtihdrawalStatus(obj.hash, withdrawal_entity_1.Status.Approved);
                console.log('status updated', JSON.parse(JSON.stringify(p)));
            }
            catch (err) {
                console.log('eeror in up', err);
            }
        }
        else
            console.log('hook', obj);
    }
    addWebhookId(obj) {
        let p = this.dbService.updateWebhookId(obj.hash, obj.hook_id, obj.to, obj.coin, obj.network);
        return 'ok';
    }
};
__decorate([
    (0, common_1.Get)('/first'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AppController.prototype, "first", null);
__decorate([
    (0, common_1.Post)('webhook'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "hook", null);
__decorate([
    (0, common_1.Post)('addWebhookId'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AppController.prototype, "addWebhookId", null);
AppController = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(database_service_1.DatabaseService)),
    __param(1, (0, common_1.Inject)(web3_service_1.Web3Service)),
    __param(2, (0, common_1.Inject)(queue_provider_1.QueueService)),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        web3_service_1.Web3Service,
        queue_provider_1.QueueService])
], AppController);
exports.AppController = AppController;
//# sourceMappingURL=app.controller.js.map