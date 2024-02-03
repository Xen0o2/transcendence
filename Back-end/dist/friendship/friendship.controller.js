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
exports.FriendshipController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FriendshipController = class FriendshipController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async friendship(friendshipWhereUniqueInput) {
        return this.prisma.friendship.findUnique({ where: friendshipWhereUniqueInput, include: { user1: true, user2: true } });
    }
    async friendships(friendshipWhereInput) {
        return this.prisma.friendship.findMany({ where: friendshipWhereInput, include: { user1: true, user2: true } });
    }
    async update(friendshipUpdateInput) {
        return this.prisma.friendship.update(friendshipUpdateInput);
    }
    async addFriend(userUpdateArgs) {
        return this.prisma.user.update(userUpdateArgs);
    }
    async updateDMChannel(dmchannelUpdateArgs) {
        return this.prisma.dMChannel.update(dmchannelUpdateArgs);
    }
    async create(data) {
        return this.prisma.friendship.create({ data, include: { user1: true, user2: true } });
    }
    async delete(friendshipWhereUniqueInput) {
        return this.prisma.friendship.delete({ where: friendshipWhereUniqueInput, include: { user1: true, user2: true } });
    }
    async createFriendship(userData) {
        try {
            const already = await this.friendships({
                OR: [
                    { user1id: userData.prisma.user1id, user2id: userData.prisma.user2id },
                    { user1id: userData.prisma.user2id, user2id: userData.prisma.user1id }
                ]
            });
            if (already.length)
                return null;
            const friendship = await this.create(userData.prisma);
            return friendship;
        }
        catch (error) {
            console.error(error);
            throw new Error('Erreur lors de l\'envoie de la demande d\'ami');
        }
    }
    async acceptFriendRequest(id) {
        try {
            const friendship = await this.update({
                data: { status: "ACCEPTED" },
                where: { id: parseInt(id) },
                include: { user1: true, user2: true }
            });
            await this.addFriend({
                data: { friends: { connect: { id: friendship.user2id } } },
                where: { id: friendship.user1id }
            });
            await this.addFriend({
                data: { friends: { connect: { id: friendship.user1id } } },
                where: { id: friendship.user2id }
            });
            try {
                await this.updateDMChannel({
                    data: { status: "OPEN" },
                    where: { user1id_user2id: { user1id: friendship.user1id, user2id: friendship.user2id } }
                });
            }
            catch (e) { }
            try {
                await this.updateDMChannel({
                    data: { status: "OPEN" },
                    where: { user1id_user2id: { user1id: friendship.user2id, user2id: friendship.user1id } }
                });
            }
            catch (e) { }
            return friendship;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'acceptation de la demande d'ami");
        }
    }
    async declineFriendRequest(friendshipId) {
        try {
            const friendship = await this.delete({
                id: parseInt(friendshipId)
            });
            return friendship;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du refus de la demande d'ami");
        }
    }
    async getAcceptedFriendship(userId) {
        try {
            const friendships = await this.friendships({
                OR: [
                    { user1id: userId },
                    { user2id: userId }
                ],
                status: "ACCEPTED"
            });
            return friendships;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de la liste d'ami");
        }
    }
    async getPendingFriendship(userId) {
        try {
            const friendships = await this.friendships({
                user1id: userId,
                status: "PENDING"
            });
            return friendships;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de la liste des demandes d'ami");
        }
    }
    async getFriendship(friendshipId) {
        try {
            const friendship = await this.friendship({
                id: friendshipId
            });
            return friendship;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du lien d'amitié");
        }
    }
    async deleteFriendship(friendshipId) {
        try {
            const friendship = this.delete({
                id: friendshipId
            });
            return friendship;
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la suppression du lien d'amitié");
        }
    }
};
exports.FriendshipController = FriendshipController;
__decorate([
    (0, common_1.Put)('create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "createFriendship", null);
__decorate([
    (0, common_1.Post)("accept/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "acceptFriendRequest", null);
__decorate([
    (0, common_1.Post)("decline/:friendshipId"),
    __param(0, (0, common_1.Param)("friendshipId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "declineFriendRequest", null);
__decorate([
    (0, common_1.Get)("friendships/accepted/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "getAcceptedFriendship", null);
__decorate([
    (0, common_1.Get)("friendships/pending/:userId"),
    __param(0, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "getPendingFriendship", null);
__decorate([
    (0, common_1.Get)("friendship/:friendshipId"),
    __param(0, (0, common_1.Param)("friendshipId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "getFriendship", null);
__decorate([
    (0, common_1.Delete)("delete/:friendshipId"),
    __param(0, (0, common_1.Param)("friendshipId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FriendshipController.prototype, "deleteFriendship", null);
exports.FriendshipController = FriendshipController = __decorate([
    (0, common_1.Controller)('friendship'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FriendshipController);
//# sourceMappingURL=friendship.controller.js.map