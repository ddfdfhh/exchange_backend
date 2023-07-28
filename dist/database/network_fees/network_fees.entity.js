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
exports.NetworkFee = void 0;
const typeorm_1 = require("typeorm");
let NetworkFee = class NetworkFee {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NetworkFee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 10,
        scale: 6,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], NetworkFee.prototype, "fees", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'decimal',
        precision: 18,
        scale: 10,
        default: () => 0.0,
    }),
    __metadata("design:type", Number)
], NetworkFee.prototype, "with_limit", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 100,
    }),
    __metadata("design:type", String)
], NetworkFee.prototype, "network", void 0);
NetworkFee = __decorate([
    (0, typeorm_1.Entity)('nw_fees')
], NetworkFee);
exports.NetworkFee = NetworkFee;
//# sourceMappingURL=network_fees.entity.js.map