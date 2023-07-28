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
exports.WSService = void 0;
const common_1 = require("@nestjs/common");
const WebSocket = require("ws");
let WSService = class WSService {
    constructor() {
        this.ws = new WebSocket('wss://stream.binance.com:9443/ws');
        this.ws.on('open', () => {
            console.log('socket opened');
        });
        this.ws.on('message', function (message) {
            console.log('rcved', message);
        });
    }
    send(data) {
        this.ws.send(data);
    }
    onMessage(handler) {
        console.log('handdler');
    }
};
WSService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WSService);
exports.WSService = WSService;
//# sourceMappingURL=websocket.service.js.map