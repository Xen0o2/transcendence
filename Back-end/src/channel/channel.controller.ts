import { Controller, Post, Body, Get, Put, Delete, Param, RawBodyRequest } from '@nestjs/common';
import { Channel, DMChannel, Muted, Prisma, User } from '@prisma/client';
import { sha256 } from 'js-sha256';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('channel')
export class ChannelController {
  constructor(
		private readonly prisma: PrismaService
	) {}

    async channel(channelWhereUniqueInput: Prisma.ChannelWhereUniqueInput): Promise<Channel | null> {
        return this.prisma.channel.findUnique({ 
            where: channelWhereUniqueInput, 
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
        })
    }

    async channels(channelWhereInput: Prisma.ChannelWhereInput): Promise<Channel[]> {
        return this.prisma.channel.findMany({ 
            where: channelWhereInput, 
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
        })
    }

    async update(channelUpdateInput: Prisma.ChannelUpdateArgs): Promise<Channel | null> {
        return this.prisma.channel.update(channelUpdateInput)
    }

    async create(data: Prisma.ChannelCreateInput): Promise<Channel> {
        return this.prisma.channel.create({ 
            data,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }
        })
    }

	async delete(channelWhereUnique: Prisma.ChannelWhereUniqueInput): Promise<Channel | null> {
        return this.prisma.channel.delete({ 
            where: channelWhereUnique,
            include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
        })
    }

    async createMuted(data: Prisma.MutedCreateInput): Promise<Muted | null> {
        return this.prisma.muted.create({
            data
        })
    }

    async deleteMuted(mutedWhereUniqueInput: Prisma.MutedWhereUniqueInput): Promise<Muted | null> {
        return this.prisma.muted.delete({ where: mutedWhereUniqueInput })
    }

	@Put('create')
	async createChannel(@Body() userData: any): Promise<Channel | null> {
    	try {
            if (userData.prisma.password === "") userData.prisma.password = null
            if (userData.prisma.password) userData.prisma.password = sha256(userData.prisma.password)
            const channel = await this.create(userData.prisma)
			return channel;
		} catch (error) {
			// Gérer les erreurs
            console.error(error)
			throw new Error('Erreur lors de la création du channel');
		}
	}

    @Post(":channelId/addUser/:userId")
    async addUserToGroup(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel> {
        try {
            const channel = await this.update({
                data: { users: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel")
        }
    }
    
    @Post(":channelId/addAdmin/:userId")
    async addAdminToGroup(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel> {
        try {
            const channel = await this.update({
                data: { admins: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel")
        }
    }

    @Post(":channelId/join/:userId")
    async joinChannel(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { users: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel")
        }
    }
    
    @Post(":channelId/join/:userId/password")
    async joinChannelWithPassword(@Param("channelId") channelId: string, @Param("userId") userId: string, @Body() userData: any): Promise<Channel | null> {
        try {
            let channel = await this.channel({ id: channelId })
            
            if (channel.password === sha256(userData.password)) {
                channel = await this.update({
                    data: { users: { connect: { id: userId } } },
                    where: { id: channelId },
                    include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
                })
                return channel;
            } else
                return null;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'ajout d'un utilisateur dans un channel")
        }
    }

    @Post(":channelId/leaveAsUser/:userId")
    async leaveChannel(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel: any = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du départ d'un utilisateur du channel")
        }
    }
   
    @Post(":channelId/leaveAsOwner/:userId")
    async leaveChannelAsOwner(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel: any = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })

            let admin = channel.admins[0].id
            let returnChannel = await this.update({
                data: { ownerId: admin },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })

            return returnChannel
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors du départ d'un utilisateur du channel")
        }
    }

    @Post(":channelId/password/add")
    async addPassword(@Param("channelId") channelId: string, @Body() userData: any): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { password: sha256(userData.password) },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'ajout d'un mot de passe sur un channel")
        }
    }
    
    @Post(":channelId/password/update")
    async updatePassword(@Param("channelId") channelId: string, @Body() userData: any): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { password: sha256(userData.password) },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }     
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la modification d'un mot de passe de channel")
        }
    }
    
    @Post(":channelId/ban/:userId")
    async banUser(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { users: { disconnect: { id: userId } }, admins: { disconnect: { id: userId } }, banned: { connect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la modification d'un mot de passe de channel")
        }
    }
    @Post(":channelId/unban/:userId")
    async unbanUser(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { banned: { disconnect: { id: userId } } },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la modification d'un mot de passe de channel")
        }
    }
    
    @Post(":channelId/mute/:userId")
    async muteUser(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {

            await this.createMuted({
                user: { connect: { id: userId } },
                channel: { connect: { id: channelId } }
            })

            const channel = await this.channel({ id: channelId })

            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la modification d'un mot de passe de channel")
        }
    }

    @Post(":channelId/unmute/:userId")
    async unmuteUser(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            await this.deleteMuted({ userId_channelId: { userId: userId, channelId: channelId } } )
            const channel = await this.channel({ id: channelId });
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la modification d'un mot de passe de channel")
        }
    }

    @Get("channels/withUser/:userId")
    async getChannelsWithUser(@Param("userId") userId: string): Promise<Channel[] | null> {
        try {
            const channels = await this.channels({
                users: {
                    some: {
                        id: userId
                    }
                }
            })
            return channels;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération de la liste des channels")
        }
    }

    @Get("channels/public")
    async getPublicChannels(): Promise<Channel[] | null> {
        try {
            const channels = await this.channels({ password: null })
            return channels;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération des channels publics")
        }
    }
    
    @Get("channels")
    async getChannels(): Promise<Channel[] | null> {
        try {
            const channels = await this.channels({ type: "PUBLIC" })
            return channels;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération des channels publics")
        }
    }

    @Get("channel")
    async getChannel(@Body() userData: any): Promise<Channel | null> {
        try {
            const channel = await this.channel(userData.prisma)
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la récupération du channel")
        }
    }

    @Get("channels/:channelName")
	async getUsersWithUsername(@Param("channelName") channelName: string): Promise<Channel[] | null> {
		try {
			const channels = await this.channels({
                type: "PUBLIC",
                name: { contains: channelName, mode: "insensitive" }
            })
			return channels;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la recherche de channels par nom")
		}
	}

    @Delete("delete/:channelId")
    async deleteChannel(@Param("channelId") channelId: string): Promise<Channel | null> {
        try {
            const channel = await this.delete({ id: channelId })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la suppression du channel")
        }
    }

    @Delete(":channelId/removeUser/:userId")
    async removeUserFromGroup(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: {
                    admins: { disconnect: { id: userId } },
                    users: { disconnect: { id: userId } }
                },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la suppression d'un utilisateur d'un channel")
        }
    }
    
    @Delete(":channelId/removeAdmin/:userId")
    async removeUserFromAdmins(@Param("channelId") channelId: string, @Param("userId") userId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: {
                    admins: { disconnect: { id: userId } }
                },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } 
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la suppression d'un utilisateur des administrateurs")
        }
    }

    @Delete(":channelId/password/remove")
    async removePassword(@Param("channelId") channelId: string): Promise<Channel | null> {
        try {
            const channel = await this.update({
                data: { password: null },
                where: { id: channelId },
                include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true }     
            })
            return channel;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la suppression du mot de passe d'un channel")
        }
    }
}
