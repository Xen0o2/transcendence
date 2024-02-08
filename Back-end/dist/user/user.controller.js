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
exports.UserController = void 0;
const common_1 = require("@nestjs/common");
const api_service_1 = require("../api/api.service");
const prisma_service_1 = require("../prisma/prisma.service");
let UserController = class UserController {
    constructor(apiService, prisma) {
        this.apiService = apiService;
        this.prisma = prisma;
    }
    async user(userWhereUniqueInput) {
        return this.prisma.user.findUnique({ where: userWhereUniqueInput,
            include: {
                matches1: { include: { user1: true, user2: true } },
                matches2: { include: { user1: true, user2: true } },
                friends: { include: { dmchannel1: { include: { user1: true, user2: true } }, dmchannel2: { include: { user1: true, user2: true } } } },
                friendship1: { include: { user1: true, user2: true } },
                friendship2: { include: { user1: true, user2: true } },
                dmchannel1: true,
                dmchannel2: true,
                blockedUsers: true,
                blockedBy: true
            }
        });
    }
    async users(userWhereInput) {
        return this.prisma.user.findMany({ where: userWhereInput,
            include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true } }, dmchannel2: { include: { user1: true, user2: true } } } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true }
        });
    }
    async createUser(data) {
        return this.prisma.user.create({ data, include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true } }, dmchannel2: { include: { user1: true, user2: true } } } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true } });
    }
    async update(UserUpdateInput) {
        return this.prisma.user.update(UserUpdateInput);
    }
    async updateDMChannel(DMChannelUpdateInput) {
        return this.prisma.dMChannel.update(DMChannelUpdateInput);
    }
    async deleteFriendship(friendshipWhereUniqueInput) {
        return this.prisma.friendship.delete({ where: friendshipWhereUniqueInput });
    }
    async loginUser(code) {
        try {
            const tokenResponse = await this.apiService.postToExternalApi({ code: code });
            const token = tokenResponse.data.access_token;
            const getDataResponse = await this.apiService.getFromExternalApi(token);
            const userAlreadyExist = await this.user({
                id: getDataResponse.data.id.toString()
            });
            let user;
            if (!userAlreadyExist)
                user = await this.createUser({
                    id: getDataResponse.data.id.toString(),
                    login: getDataResponse.data.login,
                    firstname: getDataResponse.data.first_name,
                    lastname: getDataResponse.data.last_name,
                    image: getDataResponse.data.image?.versions?.medium
                });
            else
                user = userAlreadyExist;
            return user;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erreur lors de la communication avec l\'API externe');
        }
    }
    async changeUsername(userId, userData) {
        try {
            const already = await this.user({ login: userData.username });
            if (already && already.id != userId)
                return null;
            let user = await this.user({ id: userId });
            if (userData.username === "")
                return user;
            const updatedUser = await this.update({
                data: { login: userData.username },
                where: { id: userId }
            });
            return updatedUser;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la mise à jour du pseudo");
        }
    }
    async getOtherUsers(userId) {
        try {
            const users = this.users({
                id: {
                    not: userId
                }
            });
            return users;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération des autres utilisateurs");
        }
    }
    async getUsersWithUsername(searchUsername) {
        try {
            const users = this.users({
                OR: [
                    { login: { contains: searchUsername, mode: "insensitive" } },
                    { firstname: { contains: searchUsername, mode: "insensitive" } },
                    { lastname: { contains: searchUsername, mode: "insensitive" } }
                ]
            });
            return users;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la recherche d'utilisateurs par pseudo");
        }
    }
    async getUser(userId) {
        try {
            const user = await this.user({ id: userId });
            return user;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de l'utilisateur");
        }
    }
    async getUserRank(userId) {
        try {
            let user = await this.user({ id: userId });
            let rank = await this.prisma.user.count({
                where: { level: { gte: user.level } }
            });
            return rank;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de l'utilisateur");
        }
    }
    async deblockUser(blockerId, blockedId) {
        try {
            const user = this.update({
                data: { blockedUsers: { disconnect: { id: blockedId } } },
                where: { id: blockerId },
                include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true } }, dmchannel2: { include: { user1: true, user2: true } } } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true }
            });
            await this.update({
                data: { blockedBy: { disconnect: { id: blockerId } } },
                where: { id: blockedId }
            });
            try {
                await this.updateDMChannel({
                    data: { status: "OPEN", blockerid: null },
                    where: { user1id_user2id: { user1id: blockedId, user2id: blockerId } }
                });
            }
            catch (e) { }
            try {
                await this.updateDMChannel({
                    data: { status: "OPEN", blockerid: null },
                    where: { user1id_user2id: { user1id: blockerId, user2id: blockedId } }
                });
            }
            catch (e) { }
            return user;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du déblocage d'un utilisateur");
        }
    }
    async removeFriend(userId, friendId) {
        try {
            const user = this.update({
                data: { friends: { disconnect: { id: friendId } } },
                where: { id: userId },
                include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true } }, dmchannel2: { include: { user1: true, user2: true } } } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true }
            });
            await this.update({
                data: { friends: { disconnect: { id: userId } } },
                where: { id: friendId }
            });
            try {
                await this.deleteFriendship({ user1id_user2id: { user1id: userId, user2id: friendId } });
            }
            catch (e) { }
            try {
                await this.deleteFriendship({ user1id_user2id: { user1id: friendId, user2id: userId } });
            }
            catch (e) { }
            try {
                await this.updateDMChannel({
                    data: { status: "CLOSED" },
                    where: { user1id_user2id: { user1id: userId, user2id: friendId } }
                });
            }
            catch (e) { }
            try {
                await this.updateDMChannel({
                    data: { status: "CLOSED" },
                    where: { user1id_user2id: { user1id: friendId, user2id: userId } }
                });
            }
            catch (e) { }
            return user;
        }
        catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression d'un ami");
        }
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)('login/:code'),
    __param(0, (0, common_1.Param)("code")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "loginUser", null);
__decorate([
    (0, common_1.Post)(":userId/username"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changeUsername", null);
__decorate([
    (0, common_1.Get)("otherUsers/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getOtherUsers", null);
__decorate([
    (0, common_1.Get)("users/:searchUsername"),
    __param(0, (0, common_1.Param)("searchUsername")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUsersWithUsername", null);
__decorate([
    (0, common_1.Get)(":userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)(":userId/getRank"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "getUserRank", null);
__decorate([
    (0, common_1.Post)("deblock/:blockerId/:blockedId"),
    __param(0, (0, common_1.Param)("blockerId")),
    __param(1, (0, common_1.Param)("blockedId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deblockUser", null);
__decorate([
    (0, common_1.Delete)(":userId/removeFriend/:friendId"),
    __param(0, (0, common_1.Param)("userId")),
    __param(1, (0, common_1.Param)("friendId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "removeFriend", null);
exports.UserController = UserController = __decorate([
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [api_service_1.ApiService,
        prisma_service_1.PrismaService])
], UserController);
//# sourceMappingURL=user.controller.js.map