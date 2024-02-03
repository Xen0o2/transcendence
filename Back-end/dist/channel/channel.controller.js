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
exports.ChannelController = void 0;
const common_1 = require("@nestjs/common");
const js_sha256_1 = require("js-sha256");
const prisma_service_1 = require("../prisma/prisma.service");
let ChannelController = class ChannelController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async channel(channelWhereUniqueInput) {
        return this.prisma.channel.findUnique({
            where: channelWhereUniqueInput,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
        });
    }
    async channels(channelWhereInput) {
        return this.prisma.channel.findMany({
            where: channelWhereInput,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
        });
    }
    async update(channelUpdateInput) {
        return this.prisma.channel.update(channelUpdateInput);
    }
    async create(data) {
        return this.prisma.channel.create({
            data,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
        });
    }
    async delete(channelWhereUnique) {
        return this.prisma.channel.delete({
            where: channelWhereUnique,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
        });
    }
    async createMuted(data) {
        return this.prisma.muted.create({
            data
        });
    }
    async deleteMuted(mutedWhereUniqueInput) {
        return this.prisma.muted.delete({ where: mutedWhereUniqueInput });
    }
    async createChannel(userData) {
        try {
            if (userData.prisma.password === "")
                userData.prisma.password = null;
            if (userData.prisma.password)
                userData.prisma.password = (0, js_sha256_1.sha256)(userData.prisma.password);
            const channel = await this.create(userData.prisma);
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erreur lors de la création du channel');
        }
    }
    async addUserToGroup(channelId, userId) {
        try {
            const channel = await this.update({
                data: { users: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel");
        }
    }
    async addAdminToGroup(channelId, userId) {
        try {
            const channel = await this.update({
                data: { admins: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel");
        }
    }
    async joinChannel(channelId, userId) {
        try {
            const channel = await this.update({
                data: { users: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel");
        }
    }
    async joinChannelWithPassword(channelId, userId, userData) {
        try {
            let channel = await this.channel({ id: channelId });
            if (channel.password === (0, js_sha256_1.sha256)(userData.password)) {
                channel = await this.update({
                    data: { users: { connect: { id: userId } } },
                    where: { id: channelId },
                    include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
                });
                return channel;
            }
            else
                return null;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel");
        }
    }
    async leaveChannel(channelId, userId) {
        try {
            const channel = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du départ d'un utilisateur du channel");
        }
    }
    async leaveChannelAsOwner(channelId, userId) {
        try {
            const channel = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            let admin = channel.admins[0].id;
            let returnChannel = await this.update({
                data: { ownerId: admin },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return returnChannel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du départ d'un utilisateur du channel");
        }
    }
    async addPassword(channelId, userData) {
        try {
            const channel = await this.update({
                data: { password: (0, js_sha256_1.sha256)(userData.password) },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un mot de passe sur un channel");
        }
    }
    async updatePassword(channelId, userData) {
        try {
            const channel = await this.update({
                data: { password: (0, js_sha256_1.sha256)(userData.password) },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la modification d'un mot de passe de channel");
        }
    }
    async banUser(channelId, userId) {
        try {
            const channel = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } }, banned: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la modification d'un mot de passe de channel");
        }
    }
    async unbanUser(channelId, userId) {
        try {
            const channel = await this.update({
                data: { banned: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la modification d'un mot de passe de channel");
        }
    }
    async muteUser(channelId, userId) {
        try {
            await this.createMuted({
                user: { connect: { id: userId } },
                channel: { connect: { id: channelId } }
            });
            const channel = await this.channel({ id: channelId });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la modification d'un mot de passe de channel");
        }
    }
    async unmuteUser(channelId, userId) {
        try {
            await this.deleteMuted({ userId_channelId: { userId: userId, channelId: channelId } });
            const channel = await this.channel({ id: channelId });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la modification d'un mot de passe de channel");
        }
    }
    async getChannelsWithUser(userId) {
        try {
            const channels = await this.channels({
                users: {
                    some: {
                        id: userId
                    }
                }
            });
            return channels;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de la liste des channels");
        }
    }
    async getPublicChannels() {
        try {
            const channels = await this.channels({ password: null });
            return channels;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération des channels publics");
        }
    }
    async getChannels() {
        try {
            const channels = await this.channels({ type: "PUBLIC" });
            return channels;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération des channels publics");
        }
    }
    async getChannel(userData) {
        try {
            const channel = await this.channel(userData.prisma);
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération du channel");
        }
    }
    async getUsersWithUsername(channelName) {
        try {
            const channels = await this.channels({
                type: "PUBLIC",
                name: { contains: channelName, mode: "insensitive" }
            });
            return channels;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la recherche de channels par nom");
        }
    }
    async deleteChannel(channelId) {
        try {
            const channel = await this.delete({ id: channelId });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la suppression du channel");
        }
    }
    async removeUserFromGroup(channelId, userId) {
        try {
            const channel = await this.update({
                data: {
                    admins: { disconnect: { id: userId } },
                    users: { disconnect: { id: userId } }
                },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la suppression d'un utilisateur d'un channel");
        }
    }
    async removeUserFromAdmins(channelId, userId) {
        try {
            const channel = await this.update({
                data: {
                    admins: { disconnect: { id: userId } }
                },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la suppression d'un utilisateur des administrateurs");
        }
    }
    async removePassword(channelId) {
        try {
            const channel = await this.update({
                data: { password: null },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
            });
            return channel;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la suppression du mot de passe d'un channel");
        }
    }
};
exports.ChannelController = ChannelController;
__decorate([
    (0, common_1.Put)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Post)(":channelId/addUser/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "addUserToGroup", null);
__decorate([
    (0, common_1.Post)(":channelId/addAdmin/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "addAdminToGroup", null);
__decorate([
    (0, common_1.Post)(":channelId/join/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "joinChannel", null);
__decorate([
    (0, common_1.Post)(":channelId/join/:userId/password"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "joinChannelWithPassword", null);
__decorate([
    (0, common_1.Post)(":channelId/leaveAsUser/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "leaveChannel", null);
__decorate([
    (0, common_1.Post)(":channelId/leaveAsOwner/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "leaveChannelAsOwner", null);
__decorate([
    (0, common_1.Post)(":channelId/password/add"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "addPassword", null);
__decorate([
    (0, common_1.Post)(":channelId/password/update"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Post)(":channelId/ban/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)(":channelId/unban/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Post)(":channelId/mute/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "muteUser", null);
__decorate([
    (0, common_1.Post)(":channelId/unmute/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "unmuteUser", null);
__decorate([
    (0, common_1.Get)("channels/withUser/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannelsWithUser", null);
__decorate([
    (0, common_1.Get)("channels/public"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getPublicChannels", null);
__decorate([
    (0, common_1.Get)("channels"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannels", null);
__decorate([
    (0, common_1.Get)("channel"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getChannel", null);
__decorate([
    (0, common_1.Get)("channels/:channelName"),
    __param(0, (0, common_1.Param)("channelName")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "getUsersWithUsername", null);
__decorate([
    (0, common_1.Delete)("delete/:channelId"),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "deleteChannel", null);
__decorate([
    (0, common_1.Delete)(":channelId/removeUser/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "removeUserFromGroup", null);
__decorate([
    (0, common_1.Delete)(":channelId/removeAdmin/:userId"),
    __param(0, (0, common_1.Param)("channelId")),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "removeUserFromAdmins", null);
__decorate([
    (0, common_1.Delete)(":channelId/password/remove"),
    __param(0, (0, common_1.Param)("channelId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChannelController.prototype, "removePassword", null);
exports.ChannelController = ChannelController = __decorate([
    (0, common_1.Controller)('channel'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChannelController);
//# sourceMappingURL=channel.controller.js.map