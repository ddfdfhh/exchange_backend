"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customFileSotrageOption = void 0;
const multer_1 = require("multer");
const path_1 = require("path");
const customFileSotrageOption = function (destination) {
    return {
        storage: (0, multer_1.diskStorage)({
            destination,
            filename: (req, file, cb) => {
                const randomName = Array(32)
                    .fill(null)
                    .map(() => Math.round(Math.random() * 16).toString(16))
                    .join('');
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    };
};
exports.customFileSotrageOption = customFileSotrageOption;
//# sourceMappingURL=adhar.interceptor.js.map