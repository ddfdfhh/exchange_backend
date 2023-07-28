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
exports.Wallet = exports.Coin = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
var YesNo;
(function (YesNo) {
    YesNo["YES"] = "Yes";
    YesNo["NO"] = "No";
})(YesNo || (YesNo = {}));
var Coin;
(function (Coin) {
    Coin["BTC"] = "BTC";
    Coin["BNB"] = "BNB";
    Coin["USDT"] = "USDT";
    Coin["ETH"] = "ETH";
    Coin["DRNH"] = "DRNH";
    Coin["BUSD"] = "BUSD";
    Coin["TRX"] = "TRX";
})(Coin = exports.Coin || (exports.Coin = {}));
let Wallet = class Wallet {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Wallet.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Wallet.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Wallet.prototype, "deposit_address", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Wallet.prototype, "usdt_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Wallet.prototype, "bnb_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Wallet.prototype, "eth_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Wallet.prototype, "btc_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 17,
        scale: 8,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], Wallet.prototype, "drnh_balance", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: YesNo,
        default: YesNo.NO,
    }),
    __metadata("design:type", String)
], Wallet.prototype, "white_listed", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: user_entity_1.Status,
        default: user_entity_1.Status.ACTIVE,
    }),
    __metadata("design:type", String)
], Wallet.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Wallet.prototype, "network", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 400, nullable: true }),
    __metadata("design:type", String)
], Wallet.prototype, "privateKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Wallet.prototype, "created_at", void 0);
Wallet = __decorate([
    (0, typeorm_1.Entity)('tbl_wallet')
], Wallet);
exports.Wallet = Wallet;
//# sourceMappingURL=wallet.entity.js.map