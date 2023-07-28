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
exports.Identity = exports.VerificationStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../user/user.entity");
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["VERIFIED"] = "Verfied";
    VerificationStatus["CANCELLED"] = "Cancelled";
})(VerificationStatus = exports.VerificationStatus || (exports.VerificationStatus = {}));
let Identity = class Identity {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Identity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Identity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Identity.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], Identity.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Identity.prototype, "fullname", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Identity.prototype, "govIdNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300 }),
    __metadata("design:type", String)
], Identity.prototype, "panNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Identity.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Identity.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: VerificationStatus,
        default: VerificationStatus.PENDING,
    }),
    __metadata("design:type", String)
], Identity.prototype, "verification_status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: user_entity_1.YesNo,
        default: user_entity_1.YesNo.NO,
    }),
    __metadata("design:type", String)
], Identity.prototype, "id_verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Identity.prototype, "front_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Identity.prototype, "back_path", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 300, nullable: true }),
    __metadata("design:type", String)
], Identity.prototype, "pan", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'longtext', nullable: true }),
    __metadata("design:type", String)
], Identity.prototype, "selfie", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], Identity.prototype, "created_at", void 0);
Identity = __decorate([
    (0, typeorm_1.Entity)('tbl_identity')
], Identity);
exports.Identity = Identity;
//# sourceMappingURL=identity.entity.js.map