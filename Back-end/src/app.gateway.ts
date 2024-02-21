import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Channel, Friendship, Prisma } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma/prisma.service';
import { Game } from './sockets/game.class';
import { User, UserStatus } from './sockets/user.class';


interface Invitation {
	inviterId: string,
	invitedId: string
}

@WebSocketGateway(Number(process.env.SOCKET_PORT)) 
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {

	constructor(private readonly prisma: PrismaService) {}

	private userGameMap: { [userId: string]: string } = {};
	@WebSocketServer() server: Server;

	users: User[] = [];
	invitations: Invitation[] = [];
	games: {[id: string]: Game} = {};
  
  	handleConnection(client: Socket) {
      	const ft_id = client.handshake.query.id as string
    	const login = client.handshake.query.login as string
		const alreadyLogin = this.users.find(socketUser => socketUser.ft_id === ft_id);
		if (alreadyLogin)
			return this.sendMessageToClient(client.id, "alreadyLoggedIn", {});
	  	console.log(`Now online : ${login}`);
		const user = new User(client.id, ft_id, login, 'none');
	  	this.users.push(user);
		for(let user of this.users) 
		  this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
			  return {userId: user.ft_id, status: user.status};
		  }))
	}
	
	handleDisconnect(client: Socket) {  
		const socketUser = this.users.find(socketUser => socketUser.id === client.id);
		if (!socketUser) return;
		this.users.splice(this.users.indexOf(socketUser), 1);
		for(let user of this.users) 
			this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
				return {userId: user.ft_id, status: user.status};
			}))
		this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == socketUser.ft_id || invitation.invitedId == socketUser.ft_id), 1);
		console.log(`Now offline : ${socketUser.login}`);
		const gameId = Object.keys(this.games).find(gameId => this.games[gameId].players.some(player => player.id === socketUser.id));
		if (gameId) {
			clearInterval(this.games[gameId].property.intervalTimer);
			clearTimeout(this.games[gameId].property.timeoutId);
			const game = this.games[gameId];
			game.players = game.players.filter(player => player.id !== socketUser.id);
			if (game.players.length === 0) {
			delete this.games[gameId];
			console.log(`Game ${gameId} removed because no players left.`);
			}
			if (game.property.statusGame){
			this.handleStop(client, "playerLeft");
			console.log(`Game ${gameId} removed because player left.`);
			}
			this.sendMessageToGame(game, "returnToMenu", "playerLeft");
		}
	}

  @SubscribeMessage('infosUser')
  handleInfosUser(client: Socket, data: { name: string }): void {
    const user = this.users.find(u => u.id === client.id);
    if (user) { user.login = data.name; }
  }


  @SubscribeMessage('matchmaking')
  async handleMatchmakingEvent(client: Socket) {
    console.log(`Received 'matchmaking' event from client: ${this.users.find(e => e.id == client.id).login}`);
    const user = this.users.find(u => u.id === client.id);
    let sameUser = false;
    if (user) {
      let availableGameId : string | undefined;

      // si une game existe déja
      for (const gameId in this.games) {
        if (this.games[gameId].players.length < 2){
          availableGameId = gameId;
          if (this.games[gameId].players[0].id === client.id){
            sameUser = true;
          }
          if (this.games[gameId].players[0].side === 'players1'){
            user.side = 'players2';
            this.games[availableGameId].paddles.player2.userName = user.login;
          } else {
            user.side = 'players1';
            this.games[availableGameId].paddles.player1.userName = user.login;
          }
          break;
        }
      }

      // si une game existe pas
      if (!availableGameId) {
        const newGame = new Game(this.server, () => this.handleStop(client, "jsp"), this.prisma, this.users);
        availableGameId = this.generateUniqueId();
        this.games[availableGameId] = newGame;
        user.side = 'players1';
        this.games[availableGameId].paddles.player1.userName = user.login;
      }

      // si ce n'est pas le meme joueur
      if (!sameUser && !this.games[availableGameId].property.statusGame){
        this.games[availableGameId].players.push(user);
        this.userGameMap[user.id] = availableGameId;
        client.emit('playerJoined', `You joined Game ${availableGameId}`);
      }
     
      if (this.games[availableGameId].players.length === 2) {
        const game = this.games[availableGameId];
		const user1 = await this.prisma.user.findUnique({ where: { id: game.players[0].ft_id }});
		const user2 = await this.prisma.user.findUnique({ where: { id: game.players[1].ft_id }});
        this.sendMessageToGame(game, 'userList', [user1, user2]);
      }
    }
  }


	@SubscribeMessage('play')
	handlePlayEvent(client: Socket): void {
		const gameId = this.userGameMap[client.id];
		let Time = 5;
		if (this.games[gameId].property.intervalTimer){
		clearInterval(this.games[gameId].property.intervalTimer);
		} 
		if (this.games[gameId].property.timeoutId){
		clearTimeout(this.games[gameId].property.timeoutId);
		}
		this.sendMessageToGame(this.games[gameId],"timeBeforePlay",  Time);
		this.games[gameId].property.intervalTimer = setInterval(() => {
		Time -= 1;
		this.sendMessageToGame(this.games[gameId],"timeBeforePlay",  Time);
		}, 1000);

		this.games[gameId].property.timeoutId = setTimeout(() => {
		if (this.games[gameId]){
			if (this.games[gameId]?.players.length === 2){
				this.games[gameId].startGameLoop(() => this.handleStop(client, "jsp"));
				this.sendMessageToClient(this.games[gameId].players[0].id, "drawLeft", {})
				this.sendMessageToClient(this.games[gameId].players[1].id, "drawRight", {})
				this.sendMessageToGame(this.games[gameId],"partieLaunch",  "go");
				for(let player of this.games[gameId]?.players)
					this.users.find(socketUser => socketUser.id == player.id).status = UserStatus.PLAYING
				for(let user of this.users) 
					this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
						return {userId: user.ft_id, status: user.status};
					}))
			} 
		}
		clearInterval(this.games[gameId].property.intervalTimer);
		},5000);
	}

	@SubscribeMessage('leftMatchmaking')
	handleLeftMatchMaking(client: Socket): void {
		const gameId = this.userGameMap[client.id];
		if (!gameId || !this.games[gameId]) return;

		clearInterval(this.games[gameId].property.intervalTimer);
		clearTimeout(this.games[gameId].property.timeoutId);
		const game = this.games[gameId]
		const playerIndex = game.players.findIndex(player => player.id === client.id);
		const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
		const otherPlayer = game.players[otherPlayerIndex];
		console.log(otherPlayer, otherPlayerIndex)
	
		if (otherPlayer) {
			console.log("envoie à", otherPlayer.login)
			this.sendMessageToClient(otherPlayer.id, "returnToMenu", "playerLeft");
		}
	
		if (playerIndex !== -1) {
			const leftPlayer = game.players.splice(playerIndex, 1)[0];
			delete this.userGameMap[client.id];
			console.log("delete this user", client.id)
		}
		
		if (game.players.length === 0) {
			delete this.games[gameId];
			console.log(`Le jeu ${gameId} a été supprimé car il ne reste plus de joueurs.`);
		}
	}

	@SubscribeMessage('stop')
	handleStop(client: Socket, infos : any): void {
		// console.log("partie finito");
		
		const gameId = this.userGameMap[client.id];

		// vérifie si il y a déja une partie en cours, si oui la stop
		
		if (this.games[gameId]){
		if (infos != "timer"){
			this.sendMessageToGame(this.games[gameId], "stop", "stop");
		} else {
			const userNotSentStop = this.games[gameId].players.find(user => user.id !== client.id);
			this.sendMessageToClient(userNotSentStop.id, "stop", "stop");
		}
		if (this.games[gameId].property.countdown >= 1)
			this.games[gameId].stopGameLoop();
		this.removeGame(client.id);
		}
	}

	@SubscribeMessage('ArrowUp')
	handleArrowUp(client: Socket): void {
		const gameId = this.userGameMap[client.id];
		this.games[gameId]?.arrowUp(client.id);
	}

	@SubscribeMessage('ArrowDown')
	handleArrowDown(client: Socket): void {
		const gameId = this.userGameMap[client.id];
		this.games[gameId]?.arrowDown(client.id);
	}

	// ACTIVE OU DESACTIVE LES BONUS
	@SubscribeMessage('Bonus')
	handleSetBonus(client: Socket, infos: any): void {
		console.log("infoBonus", infos);
		const gameId = this.userGameMap[client.id];
		if (infos === true)	
			this.sendMessageToGame(this.games[gameId], "bonus", true)
		else if (infos === false)
			this.sendMessageToGame(this.games[gameId], "bonus", false)
		
	};

  	// QUELQU'UN CHANGE DE SALON
  	@SubscribeMessage("switchedChannel")
	async swicthedChannel(client: Socket, data: { channelId: string }) {
		try {
			let user = this.users.find(user => user.id == client.id)
			user.currentChannel = data.channelId;
			user.currentDMChannel = "";
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du changement de salon d'un utilisateur")
		}
	}

  	// QUELQU'UN CHANGE DE DM
  	@SubscribeMessage("switchedDMChannel")
	async swicthedDMChannel(client: Socket, data: { dmchannelId: string }) {
		try {
			let user = this.users.find(user => user.id == client.id)
			user.currentDMChannel = data.dmchannelId;
			user.currentChannel = "";
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du changement de dm d'un utilisateur")
		}
	}

	// QUELQU'UN ENVOIE UN MESSAGE DANS UN SALON
	@SubscribeMessage("sendChannelMessage")
	async sendChannelMessage(client: Socket, data: { channelId: string, userId: string, messageContent: string }) {
		try {
			let message = await this.prisma.message.create({
				data: { content: data.messageContent, senderId: data.userId, channelId: data.channelId },
				include: { channel: { include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } } }
			})
			
			let users = this.users.filter(user => {
				return message.channel.users.find(u => u.id == user.ft_id) && user.currentChannel == data.channelId
			})

			for(let user of users) {
				this.sendMessageToClient(user.id, "messageReceiveInChannel", { channel: message.channel });	
			}
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la récupération de tous les utilisateurs dans un salon")
		}
	}
	
	// QUELQU'UN ENVOIE UN MESSAGE DANS UN SES DM
	@SubscribeMessage("sendDMChannelMessage")
	async sendDMChannelMessage(client: Socket, data: { dmchannelId: string, userId: string, messageContent: string }) {
		try {
			let message = await this.prisma.message.create({
				data: { content: data.messageContent, senderId: data.userId, dmchannelId: data.dmchannelId },
				include: { dmchannel: { include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } } } }
			})
			
			let users = this.users.filter(user => {
				return [message.dmchannel.user1id, message.dmchannel.user2id].includes(user.ft_id)
			})

			for(let user of users) {
				this.sendMessageToClient(user.id, "messageReceiveInDMChannel", { dmchannel: message.dmchannel });	
			}
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de la récupération de tous les utilisateurs dans un salon")
		}
	}

	@SubscribeMessage("blockUser")
	async blockUser(client: Socket, data: { blockerId: string, blockedId: string }) {
		try {
			let userBlocked = this.users.find(user => user.ft_id == data.blockedId)
			if (!userBlocked) return
			let dmchannel = await this.prisma.dMChannel.findUnique({ 
				where: { user1id_user2id: { user1id: data.blockerId, user2id: data.blockedId } },
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			if (!dmchannel) dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: data.blockedId, user2id: data.blockerId } },
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			
			let user = await this.prisma.user.findUnique({
				where: { id: data.blockedId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(userBlocked.id, "hasBeenBlocked", { dmchannel, user })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du blocage d'un utilisateur par un autre")
		}
	}
	
	@SubscribeMessage("unblockUser")
	async unblockUser(client: Socket, data: { blockerId: string, blockedId: string }) {
		try {
			let userBlocked = this.users.find(user => user.ft_id == data.blockedId)
			if (!userBlocked) return
			let dmchannel = await this.prisma.dMChannel.findUnique({ 
				where: { user1id_user2id: { user1id: data.blockerId, user2id: data.blockedId } },
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			if (!dmchannel) dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: data.blockedId, user2id: data.blockerId } },
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			
			let user = await this.prisma.user.findUnique({
				where: { id: data.blockedId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(userBlocked.id, "hasBeenUnblocked", { dmchannel, user })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du blocage d'un utilisateur par un autre")
		}
	}

	@SubscribeMessage("removeUserFromChannel")
	async removeUserFromChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId)
			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenRemovedFromChannel", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}
	
	@SubscribeMessage("removeAdminFromAdmins")
	async removeAdminFromAdmins(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))

			for(let user of users)
				this.sendMessageToClient(user.id, "adminHasBeenRemovedFromAdmins", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}
	
	@SubscribeMessage("banUserFromChannel")
	async banUserFromChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId)

			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenBannedFromChannel", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}
	
	@SubscribeMessage("unbanUserFromChannel")
	async unbanUserFromChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId)

			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenUnbannedFromChannel", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}

	@SubscribeMessage("muteUserInChannel")
	async muteUserInChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenMutedInChannel", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}
	
	@SubscribeMessage("unmuteUserInChannel")
	async unmuteUserInChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))

			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenUnmutedInChannel", { channel: data.channel, userId: data.userId })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
		}
	}
	
	@SubscribeMessage("deleteChannel")
	async deleteChannel(client: Socket, data: { channel: any }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "channelHasBeenDeleted", { channel: data.channel })
				
			} catch(error) {
				console.error(error)
				throw new Error("Erreur lors de kick d'un utilisateur d'un channel")
			}
		}
		
	@SubscribeMessage("ownerLeaveChannel")
	async ownerLeaveChannel(client: Socket, data: { channel: any }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "ownerHasLeavedChannel", { channel: data.channel })
				
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du départ du fondateur du salon")
		}
	}
	
	@SubscribeMessage("userLeaveChannel")
	async userLeaveChannel(client: Socket, data: { channel: any }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "userHasLeavedChannel", { channel: data.channel })

		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors du départ d'un utilisateur du salon")
		}
	}

	@SubscribeMessage("addAdminToChannel")
	async addAdminToChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "adminHasBeenAddedToChannel", { channel: data.channel })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'ajout d'un administrateur")
		}
	}
	
	@SubscribeMessage("addUserToChannel")
	async addUserToChannel(client: Socket, data: { channel: any, userId: string }) {
		try {
			let users = this.users.filter(socketUser => data.channel.users.find((user: any) => user.id == socketUser.ft_id))
			for(let user of users)
				this.sendMessageToClient(user.id, "userHasBeenAddedToChannel", { channel: data.channel, userId: data.userId })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'ajout d'un administrateur")
		}
	}
	
	@SubscribeMessage("channelPasswordChanged")
	async channelPasswordChanged(client: Socket, data: { channel: any }) {
		try {
			let users = this.users
			for(let user of users)
				this.sendMessageToClient(user.id, "channelPasswordHasChanged", { channel: data.channel })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'ajout d'un administrateur")
		}
	}
	
	@SubscribeMessage("getUsersStatus")
	async getUsersStatus(client: Socket) {
		try {
			this.sendMessageToClient(client.id, "usersStatus", this.users.map(user => {
				return {userId: user.ft_id, status: user.status};
			}))
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'ajout d'un administrateur")
		}
	}

	@SubscribeMessage("sendFriendRequest")
	async sendFriendRequest(client: Socket, data: { friendship: Friendship, userId: string }) {
		try {
			let socketUser = this.users.find(socketUser => socketUser.ft_id === data.userId)
			if (!socketUser) return
			let user = await this.prisma.user.findUnique({
				where: { id: data.userId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(socketUser.id, "receiveFriendRequest", { friendship: data.friendship, user })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'envoie d'une demande d'ami")
		}
	}
	
	@SubscribeMessage("acceptFriendRequest")
	async acceptFriendRequest(client: Socket, data: { userId: string }) {
		try {
			let acceptUser = this.users.find(socketUser => socketUser.ft_id === data.userId)
			if (!acceptUser) return
			let socketUser = this.users.find(socketUser => socketUser.id == client.id)
			let dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: acceptUser.ft_id, user2id: socketUser.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			if (!dmchannel) dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: acceptUser.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			let user = await this.prisma.user.findUnique({
				where: { id: data.userId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(acceptUser.id, "friendRequestAccepted", { dmchannel, user, login: socketUser.login })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'envoie d'une demande d'ami")
		}
	}
	
	@SubscribeMessage("declineFriendRequest")
	async declineFriendRequest(client: Socket, data: { userId: string }) {
		try {
			let declinedUser = this.users.find(socketUser => socketUser.ft_id === data.userId)
			if (!declinedUser) return
			let socketUser = this.users.find(socketUser => socketUser.id === client.id)
			let dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: declinedUser.ft_id, user2id: socketUser.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			if (!dmchannel) dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: declinedUser.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			let user = await this.prisma.user.findUnique({
				where: { id: data.userId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(declinedUser.id, "friendRequestDeclined", { dmchannel, user })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'envoie d'une demande d'ami")
		}
	}
	
	@SubscribeMessage("removeFriend")
	async removeFriend(client: Socket, data: { userId: string }) {
		try {
			let userRemoved = this.users.find(socketUser => socketUser.ft_id === data.userId)
			if (!userRemoved) return
			let socketUser = this.users.find(socketUser => socketUser.id == client.id)
			let dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: userRemoved.ft_id, user2id: socketUser.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			if (!dmchannel) dmchannel = await this.prisma.dMChannel.findUnique({
				where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: userRemoved.ft_id }},
				include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
			})
			
			let user = await this.prisma.user.findUnique({
				where: { id: data.userId },
				include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
			})
			this.sendMessageToClient(userRemoved.id, "friendHasBeenRemoved", { dmchannel, user })
		} catch(error) {
			console.error(error)
			throw new Error("Erreur lors de l'envoie d'une demande d'ami")
		}
	}

	@SubscribeMessage("getGameInvitation")
	async getGameInvitation(client: Socket, data: { userId: string }) {
		const invitation = this.invitations.find(invitation => invitation.inviterId === data.userId || invitation.invitedId === data.userId);
		if (!invitation) return;
		const inviter = await this.prisma.user.findUnique({where: { id: invitation.inviterId }});
		const invited = await this.prisma.user.findUnique({where: { id: invitation.invitedId }});
		this.sendMessageToClient(client.id, "gameInvitationList", { inviter, invited })
	}

	@SubscribeMessage("gameInvitationSent")
	async gameInvitationSent(client: Socket, data: { inviterId: string, invitedId: string }) {
		const userInviter = this.users.find(e => e.ft_id === data.inviterId)
		const userInvited = this.users.find(e => e.ft_id === data.invitedId);
		if (!userInvited)
			return this.sendMessageToClient(userInviter.id, "userInvitedIsOffline", {});
		
		const alreadyInvited = this.invitations.find(invitation => invitation.invitedId === data.invitedId);
		if (alreadyInvited)
			return this.sendMessageToClient(userInviter.id, "userAlreadyInvited", {});
		
		const alreadyInvite = this.invitations.find(invitation => invitation.inviterId === data.invitedId);
		if (alreadyInvite)
			return this.sendMessageToClient(userInviter.id, "userAlreadyInviter", {});

		if (!userInviter || !userInvited)
			return;
		const inviter = await this.prisma.user.findUnique({ where: { id: data.inviterId }})
		if (!inviter)
			return;
		this.invitations.push({ inviterId: data.inviterId, invitedId: data.invitedId });
		this.sendMessageToClient(userInvited.id, "gameInvitationReceived", inviter);
	}

	@SubscribeMessage("gameInvitationCancel")
	async gameInvitationCancel(client: Socket, data: { inviterId: string, invitedId: string }) {
		this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
		const userInvited = this.users.find(socketUser => socketUser.ft_id == data.invitedId)
		if (userInvited)
			this.sendMessageToClient(userInvited.id, "gameInvitationCancelled", {});
	}
	
	@SubscribeMessage("gameInvitationAccept")
	async gameInvitationAccept(client: Socket, data: { inviterId: string, invitedId: string }) {
		this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
		const socketUserInviter = this.users.find(socketUser => socketUser.ft_id === data.inviterId)
		const socketUserInvited = this.users.find(socketUser => socketUser.ft_id === data.invitedId)
		const userInviter = await this.prisma.user.findUnique({ where: { id: socketUserInviter.ft_id }});
		const userInvited = await this.prisma.user.findUnique({ where: { id: socketUserInvited.ft_id }});

		const game = new Game(this.server, () => this.handleStop(client, "jsp"), this.prisma, this.users);
		const gameId = this.generateUniqueId();
		
		socketUserInviter.side = "players1";
		socketUserInvited.side = "players2";

		game.paddles.player1.userName = socketUserInviter.login;
		game.paddles.player2.userName = socketUserInvited.login;
		
		game.players.push(socketUserInviter);
		game.players.push(socketUserInvited);

		this.userGameMap[socketUserInviter.id] = gameId;
		this.userGameMap[socketUserInvited.id] = gameId;
		
		this.games[gameId] = game;

		for(let id of [socketUserInviter.id, socketUserInvited.id])
			this.sendMessageToClient(id, "userList", [userInviter, userInvited])
	}

	@SubscribeMessage("gameInvitationDecline")
	async gameInvitationDecline(client: Socket, data: { inviterId: string, invitedId: string }) {
		this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
		const userInviter = this.users.find(socketUser => socketUser.ft_id == data.inviterId)
		console.log(userInviter)
		if (userInviter)
			this.sendMessageToClient(userInviter.id, "gameInvitationDeclined", {});
	}




	sendMessageToClient(clientId: string, event: string, message: any) {
		this.server.to(clientId).emit(event, message);
	}

	sendMessageToGame(game: any, where: string,  object: any){
		if (game)
			game.players.forEach(player => {
				this.server.to(player.id).emit(where, object);
			});
		
	}

	removeGame(clientId: string) : any {
		const gameId = this.userGameMap[clientId];
		delete this.games[gameId];
	};


	private generateUniqueId(): string {
		return Math.random().toString(36).substring(2, 9);
	}
}