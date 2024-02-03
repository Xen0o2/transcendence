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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const path = require("path");
const prisma_service_1 = require("../prisma/prisma.service");
let ImagesController = class ImagesController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUploads(filename, res) {
        const file = path.join(__dirname, "..", "..", "uploads", filename);
        return res.sendFile(file);
    }
    async uploadFile(file, userId) {
        await this.prisma.user.update({
            data: { image: `${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}/${file.path}` },
            where: { id: userId }
        });
        return file.filename;
    }
};
exports.ImagesController = ImagesController;
__decorate([
    (0, common_1.Get)(":filename"),
    __param(0, (0, common_1.Param)("filename")),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "getUploads", null);
__decorate([
    (0, common_1.Post)('upload/:userId'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ImagesController.prototype, "uploadFile", null);
exports.ImagesController = ImagesController = __decorate([
    (0, common_1.Controller)('images'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ImagesController);
//# sourceMappingURL=images.controller.js.map