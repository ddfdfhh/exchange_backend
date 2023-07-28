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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Deposit = void 0;
const typeorm_1 = require("typeorm");
const wallet_entity_1 = require("../wallet/wallet.entity");
const withdrawal_entity_1 = require("../withdrawal_entity/withdrawal.entity");
const user_entity_1 = require("../user/user.entity");
let Deposit = class Deposit {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Deposit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Deposit.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 400 }),
    __metadata("design:type", String)
], Deposit.prototype, "from_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 400 }),
    __metadata("design:type", String)
], Deposit.prototype, "to_address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Deposit.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: wallet_entity_1.Coin,
    }),
    __metadata("design:type", String)
], Deposit.prototype, "coin", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Deposit.prototype, "network", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_entity_1.YesNo, default: user_entity_1.YesNo.NO }),
    __metadata("design:type", String)
], Deposit.prototype, "deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: withdrawal_entity_1.Status,
        default: withdrawal_entity_1.Status.Pending,
    }),
    __metadata("design:type", String)
], Deposit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Deposit.prototype, "transaction_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Deposit.prototype, "response", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Deposit.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], Deposit.prototype, "start_block", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Deposit.prototype, "confirmations", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Deposit.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Deposit.prototype, "updated_at", void 0);
Deposit = __decorate([
    (0, typeorm_1.Entity)('tbl_deposit')
], Deposit);
exports.Deposit = Deposit;
//# sourceMappingURL=deposit.entity.js.map