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
exports.DmchannelController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DmchannelController = class DmchannelController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async dmChannel(DMChannelWhereUnique) {
        return this.prisma.dMChannel.findUnique({ where: DMChannelWhereUnique, include: { user1: true, user2: true, messages: { include: { sender: true } } } });
    }
    async dmChannels(DMChannelWhereInput) {
        return this.prisma.dMChannel.findMany({ where: DMChannelWhereInput, include: { user1: true, user2: true, messages: { include: { sender: true } } } });
    }
    async update(DMChannelUpdateInput) {
        return this.prisma.dMChannel.update(DMChannelUpdateInput);
    }
    async create(data) {
        return this.prisma.dMChannel.create({ data, include: { user1: true, user2: true, messages: { include: { sender: true } } } });
    }
    async delete(DMChannelWhereUnique) {
        return this.prisma.dMChannel.delete({ where: DMChannelWhereUnique });
    }
    async deleteFriendship(friendshipWhereUnique) {
        return this.prisma.friendship.delete({ where: friendshipWhereUnique });
    }
    async updateUser(userUpdateInput) {
        return this.prisma.user.update(userUpdateInput);
    }
    async createDMChannel(userData) {
        try {
            const channel = await this.create(userData.prisma);
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erreur lors de la création du DM');
        }
    }
    async getDMChannels(userId) {
        try {
            const dmchannels = await this.dmChannels({
                OR: [
                    { user1id: userId },
                    { user2id: userId }
                ]
            });
            return dmchannels;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération des DM");
        }
    }
    async blockUser(dmchannelId, blockerId) {
        try {
            const dmchannel = await this.update({
                data: { status: "BLOCKED", blockerid: blockerId },
                where: { id: dmchannelId },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            try {
                await this.deleteFriendship({
                    user1id_user2id: { user1id: dmchannel.user1id, user2id: dmchannel.user2id }
                });
            }
            catch (e) { }
            try {
                await this.deleteFriendship({
                    user1id_user2id: { user1id: dmchannel.user2id, user2id: dmchannel.user1id }
                });
            }
            catch (e) { }
            await this.updateUser({
                data: { friends: { disconnect: { id: dmchannel.user1id } } },
                where: { id: dmchannel.user2id }
            });
            await this.updateUser({
                data: { friends: { disconnect: { id: dmchannel.user2id } } },
                where: { id: dmchannel.user1id }
            });
            await this.updateUser({
                data: { blockedUsers: { connect: { id: dmchannel.user1id === blockerId ? dmchannel.user2id : dmchannel.user1id } } },
                where: { id: blockerId }
            });
            return dmchannel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du blocage d'un utilisateur");
        }
    }
    async unblockUser(dmchannelId) {
        try {
            const dmchannel = await this.update({
                data: { status: "OPEN" },
                where: { id: dmchannelId },
                include: { user1: { include: { friendship1: true, friendship2: true, blockedUsers: true } }, user2: { include: { friendship1: true, friendship2: true, blockedUsers: true } }, messages: { include: { sender: true } } }
            });
            try {
                await this.updateUser({
                    data: { blockedUsers: { disconnect: { id: dmchannel.user1id } } },
                    where: { id: dmchannel.user2id }
                });
            }
            catch (e) { }
            try {
                await this.updateUser({
                    data: { blockedUsers: { disconnect: { id: dmchannel.user2id } } },
                    where: { id: dmchannel.user1id }
                });
            }
            catch (e) { }
            return dmchannel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du blocage d'un utilisateur");
        }
    }
};
exports.DmchannelController = DmchannelController;
__decorate([
    (0, common_1.Put)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DmchannelController.prototype, "createDMChannel", null);
__decorate([
    (0, common_1.Get)("dmChannels/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DmchannelController.prototype, "getDMChannels", null);
__decorate([
    (0, common_1.Post)("block/:dmchannelId/:blockerId"),
    __param(0, (0, common_1.Param)("dmchannelId")),
    __param(1, (0, common_1.Param)("blockerId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DmchannelController.prototype, "blockUser", null);
__decorate([
    (0, common_1.Post)("unblock/:dmchannelId"),
    __param(0, (0, common_1.Param)("dmchannelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DmchannelController.prototype, "unblockUser", null);
exports.DmchannelController = DmchannelController = __decorate([
    (0, common_1.Controller)('dmChannel'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DmchannelController);
//# sourceMappingURL=dmchannel.controller.js.map