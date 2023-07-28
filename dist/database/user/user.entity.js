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
exports.User = exports.YesNo = exports.Status = void 0;
const typeorm_1 = require("typeorm");
var Status;
(function (Status) {
    Status["ACTIVE"] = "Active";
    Status["INACTIVE"] = "In-Active";
    Status["BLACKLISTED"] = "Blacklisted";
})(Status = exports.Status || (exports.Status = {}));
var YesNo;
(function (YesNo) {
    YesNo["YES"] = "Yes";
    YesNo["NO"] = "No";
})(YesNo = exports.YesNo || (exports.YesNo = {}));
let User = class User {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], User.prototype, "uuid", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "referral_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], User.prototype, "zasper_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "phone_number", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], User.prototype, "refreshToken", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "twofa_secret", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: Status,
        default: Status.ACTIVE,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: YesNo,
        default: YesNo.NO,
    }),
    __metadata("design:type", String)
], User.prototype, "email_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: YesNo,
        default: YesNo.NO,
    }),
    __metadata("design:type", String)
], User.prototype, "is_two_fa_enabled", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: YesNo,
        default: YesNo.NO,
    }),
    __metadata("design:type", String)
], User.prototype, "id_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 17, scale: 8, default: 0.0 }),
    __metadata("design:type", Number)
], User.prototype, "spot_wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 17, scale: 8, default: 0.0 }),
    __metadata("design:type", Number)
], User.prototype, "fund_wallet", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], User.prototype, "ip_address", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], User.prototype, "logged_in_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], User.prototype, "created_at", void 0);
User = __decorate([
    (0, typeorm_1.Entity)('tbl_users')
], User);
exports.User = User;
//# sourceMappingURL=user.entity.js.map