import { Controller, Post, Body, Get, Put, Delete, Param } from '@nestjs/common';
import { Channel, DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { sha256 } from 'js-sha256';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('friendship')
export class FriendshipController {
  constructor(
		private readonly prisma: PrismaService
	) {}

    async friendship(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null> {
        return this.prisma.friendship.findUnique({ where: friendshipWhereUniqueInput, include: { user1: true, user2: true } })
    }

    async friendships(friendshipWhereInput: Prisma.FriendshipWhereInput): Promise<Friendship[] | null> {
        return this.prisma.friendship.findMany({ where: friendshipWhereInput, include: { user1: true, user2: true }})
    }

    async update(friendshipUpdateInput: Prisma.FriendshipUpdateArgs): Promise<Friendship | null> {
        return this.prisma.friendship.update(friendshipUpdateInput)
    }

    async addFriend(userUpdateArgs: Prisma.UserUpdateArgs): Promise<User | null> {
        return this.prisma.user.update(userUpdateArgs)
    }

    async updateDMChannel(dmchannelUpdateArgs: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null> {
        return this.prisma.dMChannel.update(dmchannelUpdateArgs)
    }

    async create(data: Prisma.FriendshipCreateInput): Promise<Friendship> {
        return this.prisma.friendship.create({ data, include: { user1: true, user2: true }})
    }

	async delete(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null> {
        return this.prisma.friendship.delete({ where: friendshipWhereUniqueInput, include: { user1: true, user2: true } })
    }

	@Put('create')
	async createFriendship(@Body() userData: any): Promise<Friendship | null> {
    	try {
            const already = await this.friendships({
                OR: [
                    { user1id: userData.prisma.user1id, user2id: userData.prisma.user2id },
                    { user1id: userData.prisma.user2id, user2id: userData.prisma.user1id}
                ]
            })
            if (already.length) return null;
            const friendship = await this.create(userData.prisma)
			return friendship;
		} catch (error) {
			// Gérer les erreurs
            console.error(error)
			throw new Error('Erreur lors de l\'envoie de la demande d\'ami');
		}
	}

    @Post("accept/:id")
    async acceptFriendRequest(@Param("id") id: string): Promise<Friendship | null> {
        try {
            const friendship = await this.update({
                data: { status: "ACCEPTED" },
                where: { id: parseInt(id) },
                include: { user1: true, user2: true }
            })

            await this.addFriend({
                data: { friends: { connect: { id: friendship.user2id }}},
                where: { id: friendship.user1id }
            })
            
            await this.addFriend({
                data: { friends: { connect: { id: friendship.user1id }}},
                where: { id: friendship.user2id }
            })

            try {
                await this.updateDMChannel({
                    data: { status: "OPEN" },
                    where: { user1id_user2id: { user1id: friendship.user1id, user2id: friendship.user2id } }
                })
            } catch(e) {}
            
            try {
                await this.updateDMChannel({
                    data: { status: "OPEN" },
                    where: { user1id_user2id: { user1id: friendship.user2id, user2id: friendship.user1id } }
                })
            } catch(e) {}

            return friendship;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'acceptation de la demande d'ami")
        }
    }
    
    @Post("decline/:friendshipId")
    async declineFriendRequest(@Param("friendshipId") friendshipId: string): Promise<Friendship | null> {
        try {
            const friendship = await this.delete({
                id: parseInt(friendshipId)
            })

            return friendship;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du refus de la demande d'ami")
        }
    }

    @Get("friendships/accepted/:userId")
    async getAcceptedFriendship(@Param("userId") userId: string): Promise<Friendship[] | null> {
        try {
            const friendships = await this.friendships({
                OR: [
                    { user1id: userId },
                    { user2id: userId }
                ],
                status: "ACCEPTED"
            })
            return friendships;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération de la liste d'ami")
        }
    }
    
    @Get("friendships/pending/:userId")
    async getPendingFriendship(@Param("userId") userId: string): Promise<Friendship[] | null> {
        try {
            const friendships = await this.friendships({
                user1id: userId,
                status: "PENDING"
            })
            return friendships;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération de la liste des demandes d'ami")
        }
    }

    @Get("friendship/:friendshipId")
    async getFriendship(@Param("friendshipId") friendshipId: number): Promise<Friendship | null> {
        try {
            const friendship = await this.friendship({
                id: friendshipId
            })
            return friendship;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du lien d'amitié")
        }
    }

    @Delete("delete/:friendshipId")
    async deleteFriendship(@Param("friendshipId") friendshipId: number): Promise<Friendship | null> {
        try {
            const friendship = this.delete({
                id: friendshipId
            })
            return friendship;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la suppression du lien d'amitié")
        }
    }
}
