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
exports.OrderBook = void 0;
const typeorm_1 = require("typeorm");
let OrderBook = class OrderBook {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], OrderBook.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], OrderBook.prototype, "uid", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OrderBook.prototype, "side", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OrderBook.prototype, "symbol", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], OrderBook.prototype, "fills", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], OrderBook.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: 0.0, type: 'decimal', precision: 17, scale: 8 }),
    __metadata("design:type", Number)
], OrderBook.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 17, scale: 8 }),
    __metadata("design:type", Number)
], OrderBook.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0.0, type: 'decimal', precision: 17, scale: 8 }),
    __metadata("design:type", Number)
], OrderBook.prototype, "orgSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0.0, type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], OrderBook.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Boolean)
], OrderBook.prototype, "is_filled", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], OrderBook.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], OrderBook.prototype, "settled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], OrderBook.prototype, "parent_id", void 0);
OrderBook = __decorate([
    (0, typeorm_1.Entity)('tbl_order_books')
], OrderBook);
exports.OrderBook = OrderBook;
//# sourceMappingURL=order_book.entity.js.map