import { Controller, Post, Body, Get, Put, Delete, Param } from '@nestjs/common';
import { DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { sha256 } from 'js-sha256';
import { ApiService } from 'src/api/api.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('dmChannel')
export class DmchannelController {
  constructor(
		private readonly prisma: PrismaService
	) {}

    async dmChannel(DMChannelWhereUnique: Prisma.DMChannelWhereUniqueInput): Promise<DMChannel | null> {
        return this.prisma.dMChannel.findUnique({ where: DMChannelWhereUnique, include: { user1: true, user2: true, messages: { include: { sender: true } } }})
    }

    async dmChannels(DMChannelWhereInput: Prisma.DMChannelWhereInput): Promise<DMChannel[]> {
        return this.prisma.dMChannel.findMany({ where: DMChannelWhereInput, include: { user1: true, user2: true, messages: { include: { sender: true } } } })
    }

    async update(DMChannelUpdateInput: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null> {
        return this.prisma.dMChannel.update(DMChannelUpdateInput)
    }

    async create(data: Prisma.DMChannelCreateInput): Promise<DMChannel> {
        return this.prisma.dMChannel.create({ data, include: { user1: true, user2: true, messages: { include: { sender: true } } } })
    }

	async delete(DMChannelWhereUnique: Prisma.DMChannelWhereUniqueInput): Promise<DMChannel | null> {
        return this.prisma.dMChannel.delete({ where: DMChannelWhereUnique })
    }

    async deleteFriendship(friendshipWhereUnique: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null> {
        return this.prisma.friendship.delete({ where: friendshipWhereUnique })
    }

    async updateUser(userUpdateInput: Prisma.UserUpdateArgs): Promise<User | null> {
        return this.prisma.user.update(userUpdateInput)
    }

	@Put('create')
	async createDMChannel(@Body() userData: any): Promise<DMChannel | null> {
    	try {
            const channel = await this.create(userData.prisma)
			return channel;
		} catch (error) {
			// Gérer les erreurs
            console.error(error)
			throw new Error('Erreur lors de la création du DM');
		}
	}

    @Get("dmChannels/:userId")
    async getDMChannels(@Param("userId") userId: string): Promise<DMChannel[] | null> {
        try {
            const dmchannels = await this.dmChannels({
                OR: [
                    { user1id: userId },
                    { user2id: userId }
                ]
            })
            return dmchannels;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération des DM")
        }
    }

    @Post("block/:dmchannelId/:blockerId")
    async blockUser(@Param("dmchannelId") dmchannelId: string, @Param("blockerId") blockerId: string): Promise<DMChannel | null> {
        try {
            const dmchannel = await this.update({
                data: { status: "BLOCKED", blockerid: blockerId },
                where: { id: dmchannelId },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            })

            try {
                await this.deleteFriendship({
                    user1id_user2id: { user1id: dmchannel.user1id, user2id: dmchannel.user2id }
                })
            } catch(e) {}
            
            try {
                await this.deleteFriendship({
                    user1id_user2id: { user1id: dmchannel.user2id, user2id: dmchannel.user1id }
                })
            } catch(e) {}

            await this.updateUser({
                data: { friends: { disconnect: { id: dmchannel.user1id } } },
                where: { id: dmchannel.user2id }
            })
            
            await this.updateUser({
                data: { friends: { disconnect: { id: dmchannel.user2id } } },
                where: { id: dmchannel.user1id }
            })

            await this.updateUser({
                data: { blockedUsers: { connect: { id: dmchannel.user1id === blockerId ? dmchannel.user2id : dmchannel.user1id } } },
                where: { id: blockerId }
            })

            return dmchannel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du blocage d'un utilisateur")
        }
    }
    
    @Post("unblock/:dmchannelId")
    async unblockUser(@Param("dmchannelId") dmchannelId: string): Promise<DMChannel | null> {
        try {
            const dmchannel = await this.update({
                data: { status: "OPEN"},
                where: { id: dmchannelId },
                include: { user1: { include: { friendship1: true, friendship2: true, blockedUsers: true } }, user2: { include: { friendship1: true, friendship2: true, blockedUsers: true } }, messages: { include: { sender: true } } }
            })

            try {
                await this.updateUser({
                    data: { blockedUsers: { disconnect: { id: dmchannel.user1id } } },
                    where: { id: dmchannel.user2id }
                })
            } catch(e) {}
            
            try {
                await this.updateUser({
                    data: { blockedUsers: { disconnect: { id: dmchannel.user2id } } },
                    where: { id: dmchannel.user1id }
                })
            } catch(e) {}

            return dmchannel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du blocage d'un utilisateur")
        }
    }
}
