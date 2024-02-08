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
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = require("nodemailer");
const prisma_service_1 = require("../prisma/prisma.service");
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'TranscendenceMulhouse@gmail.com',
        pass: process.env.MAIL_PASSWORD,
    },
});
function generateRandomCode() {
    const min = 100000;
    const max = 999999;
    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomCode.toString();
}
const codes = {};
let MailController = class MailController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verify({ mail }, userId) {
        try {
            const code = generateRandomCode();
            const mailOptions = {
                from: 'TranscendenceMulhouse@gmail.com',
                to: mail,
                subject: '2 Factor Authentication',
                text: code,
            };
            codes[userId] = code;
            const response = await transporter.sendMail(mailOptions);
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'envoie du code par mail");
        }
    }
    async verifyCode(userId, code, { mail }) {
        try {
            let validCode = codes[userId];
            if (validCode == parseInt(code)) {
                await this.prisma.user.update({
                    data: { mail },
                    where: { id: userId }
                });
                delete codes[userId];
                return ({ status: 200, message: "Successful a2f verification" });
            }
            else {
                return ({ status: 403, message: "Failed a2f verification" });
            }
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la vérification du code d'un utilisateur");
        }
    }
    async disable2fa(userId) {
        try {
            let user = await this.prisma.user.update({
                data: { mail: null },
                where: { id: userId }
            });
            return user;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la désactivation de l'a2f d'un utilisateur");
        }
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Post)("verify/:userId"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)("verify/:userId/:code"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("code")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "verifyCode", null);
__decorate([
    (0, common_1.Delete)("disable/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "disable2fa", null);
exports.MailController = MailController = __decorate([
    (0, common_1.Controller)('mail'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MailController);
//# sourceMappingURL=mail.controller.js.map