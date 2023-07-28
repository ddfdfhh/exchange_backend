"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const cookieParser = require("cookie-parser");
const express_1 = require("express");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        next();
    });
    app.enableCors({
        allowedHeaders: '*',
        origin: '*',
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.use(cookieParser());
    app.use((0, express_1.json)({ limit: '250mb' }));
    app.use((0, express_1.urlencoded)({ extended: true, limit: '250mb' }));
    await app.listen(4000);
}
bootstrap();
//# sourceMappingURL=main.js.map