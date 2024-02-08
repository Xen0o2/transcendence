// user.controller.ts

import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { ApiService } from 'src/api/api.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('user')
export class UserController {
  constructor(
		private readonly apiService: ApiService,
		private prisma: PrismaService
	) {}

	async user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null> {
		return this.prisma.user.findUnique({ where: userWhereUniqueInput, 
			include: { 
				matches1: { include: { user1: true, user2: true } },
				matches2: { include: { user1: true, user2: true } },
				friends: { include: { dmchannel1: { include: { user1: true, user2: true }}, dmchannel2: { include: { user1: true, user2: true }} } }, 
				friendship1: { include: { user1: true, user2: true } }, 
				friendship2: { include: { user1: true, user2: true } }, 
				dmchannel1: true, 
				dmchannel2: true, 
				blockedUsers: true, 
				blockedBy: true 
			} 
		})
	}

	async users(userWhereInput: Prisma.UserWhereInput): Promise<User[] | null> {
		return this.prisma.user.findMany({ where: userWhereInput, 
			include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true }}, dmchannel2: { include: { user1: true, user2: true }} } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true } 
		})
	}

	async createUser(data: Prisma.UserCreateInput): Promise<User> {
		return this.prisma.user.create({ data, include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true }}, dmchannel2: { include: { user1: true, user2: true }} } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true } })
	}

	async update(UserUpdateInput: Prisma.UserUpdateArgs): Promise<User | null> {
        return this.prisma.user.update(UserUpdateInput)
    }

	async updateDMChannel(DMChannelUpdateInput: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null> {
        return this.prisma.dMChannel.update(DMChannelUpdateInput)
    }

	async deleteFriendship(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null> {
        return this.prisma.friendship.delete({ where: friendshipWhereUniqueInput })
    }

	@Post('login/:code')
	async loginUser(@Param("code") code: string): Promise<User | null> {
    	try {
			const tokenResponse = await this.apiService.postToExternalApi({code: code});
			const token = tokenResponse.data.access_token;
			const getDataResponse = await this.apiService.getFromExternalApi(token);
			const userAlreadyExist = await this.user({
				id: getDataResponse.data.id.toString()
			})
			
			let user: User;
			if (!userAlreadyExist)
				user = await this.createUser({
					id: getDataResponse.data.id.toString(),
					login: getDataResponse.data.login,
					firstname: getDataResponse.data.first_name,
					lastname: getDataResponse.data.last_name,
					image: getDataResponse.data.image?.versions?.medium
				})
			else
				user = userAlreadyExist

			return user;
		} catch (error) {
			// Gérer les erreurs
			console.error(error)
			throw new Error('Erreur lors de la communication avec l\'API externe');
		}
	}

	@Post(":userId/username")
	async changeUsername(@Param("userId") userId: string, @Body() userData: any): Promise <User | null> {
		try {
			const already = await this.user({ login: userData.username })
			if (already && already.id != userId)
				return null
			
			let user = await this.user({ id: userId });
			if (userData.username === "")
				return user;
			const updatedUser = await this.update({
				data: { login: userData.username },
				where: { id: userId }
			})
			return updatedUser;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la mise à jour du pseudo")
		}
	}

	@Get("otherUsers/:userId")
	async getOtherUsers(@Param("userId") userId: string): Promise<User[]> {
		try {
			const users = this.users({
				id: {
					not: userId
				}
			})
			return users;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la récupération des autres utilisateurs")
		}
	}

	@Get("users/:searchUsername")
	async getUsersWithUsername(@Param("searchUsername") searchUsername: string): Promise<User[] | null> {
		try {
			const users = this.users({
				OR: [
					{ login: { contains: searchUsername, mode: "insensitive" } },
					{ firstname: { contains: searchUsername, mode: "insensitive" } },
					{ lastname: { contains: searchUsername, mode: "insensitive" } }
				]
			})
			return users;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la recherche d'utilisateurs par pseudo")
		}
	}

	@Get(":userId")
	async getUser(@Param("userId") userId: string): Promise<User | null> {
		try {
			const user = await this.user({ id: userId });
			return user;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la récupération de l'utilisateur")
		}
	}
	
	@Get(":userId/getRank")
	async getUserRank(@Param("userId") userId: string): Promise<number> {
		try {
			let user = await this.user({ id: userId });
			let rank = await this.prisma.user.count({
				where: { level: { gte: user.level }}
			})
			return rank;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la récupération de l'utilisateur")
		}
	}

	@Post("deblock/:blockerId/:blockedId")
	async deblockUser(@Param("blockerId") blockerId: string, @Param("blockedId") blockedId: string): Promise<User | null> {
		try {
			const user = this.update({
				data: { blockedUsers: { disconnect: { id: blockedId } } },
				where: { id: blockerId },
				include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true }}, dmchannel2: { include: { user1: true, user2: true }} } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true } 
			})

			await this.update({
				data: { blockedBy: { disconnect: { id: blockerId } } },
				where: { id: blockedId }
			})

			try {
				await this.updateDMChannel({
					data: { status: "OPEN", blockerid: null },
					where: { user1id_user2id: { user1id: blockedId, user2id: blockerId } }
				})
			} catch(e) {}
			
			try {
				await this.updateDMChannel({
					data: { status: "OPEN", blockerid: null },
					where: { user1id_user2id: { user1id: blockerId, user2id: blockedId } }
				})
			} catch(e) {}
			
			return user;
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du déblocage d'un utilisateur")
		}
	}

	@Delete(":userId/removeFriend/:friendId")
	async removeFriend(@Param("userId") userId: string, @Param("friendId") friendId: string): Promise<User | null> {
		try {
			const user = this.update({
				data: { friends: { disconnect: { id: friendId } } },
				where: { id: userId },
				include: { matches1: { include: { user1: true, user2: true } }, matches2: { include: { user1: true, user2: true } }, friends: { include: { dmchannel1: { include: { user1: true, user2: true }}, dmchannel2: { include: { user1: true, user2: true }} } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true } 
			})

			await this.update({
				data: { friends: { disconnect: { id: userId } } },
				where: { id: friendId }
			})

			try {
				await this.deleteFriendship({ user1id_user2id: { user1id: userId, user2id: friendId }})
			} catch(e) {}
			
			try {
				await this.deleteFriendship({ user1id_user2id: { user1id: friendId, user2id: userId }})
			} catch(e) {}

			try {
				await this.updateDMChannel({
					data: { status: "CLOSED" },
					where: { user1id_user2id: { user1id: userId, user2id: friendId } }
				})
			} catch(e) {}
			
			try {
				await this.updateDMChannel({
					data: { status: "CLOSED" },
					where: { user1id_user2id: { user1id: friendId, user2id: userId } }
				})
			} catch(e) {}

			return user;
		} catch(error) {
			console.error(error)
			alert("Erreur lors de la suppression d'un ami")
		}
	}
}
