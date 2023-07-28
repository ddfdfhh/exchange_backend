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
exports.Withdrawal = exports.Status = void 0;
const typeorm_1 = require("typeorm");
const wallet_entity_1 = require("../wallet/wallet.entity");
const user_entity_1 = require("../user/user.entity");
var Status;
(function (Status) {
    Status["Pending"] = "Pending";
    Status["Approved"] = "Approved";
    Status["Rejected"] = "Rejected";
    Status["Reverted"] = "Reverted";
})(Status = exports.Status || (exports.Status = {}));
let Withdrawal = class Withdrawal {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Withdrawal.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Withdrawal.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 400, nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "from_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 400 }),
    __metadata("design:type", String)
], Withdrawal.prototype, "to_address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "with_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Withdrawal.prototype, "confirmations", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: wallet_entity_1.Coin,
    }),
    __metadata("design:type", String)
], Withdrawal.prototype, "coin", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: user_entity_1.YesNo,
        default: user_entity_1.YesNo.NO
    }),
    __metadata("design:type", String)
], Withdrawal.prototype, "pay_by_admin", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: user_entity_1.YesNo, default: user_entity_1.YesNo.NO }),
    __metadata("design:type", String)
], Withdrawal.prototype, "deleted", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Withdrawal.prototype, "network", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "webhook_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Status,
        default: Status.Pending,
    }),
    __metadata("design:type", String)
], Withdrawal.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "transaction_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "response", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Withdrawal.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Withdrawal.prototype, "updated_at", void 0);
Withdrawal = __decorate([
    (0, typeorm_1.Entity)('tbl_withdrawal')
], Withdrawal);
exports.Withdrawal = Withdrawal;
//# sourceMappingURL=withdrawal.entity.js.map