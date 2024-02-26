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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const prisma_service_1 = require("./prisma/prisma.service");
const game_class_1 = require("./sockets/game.class");
const user_class_1 = require("./sockets/user.class");
let AppGateway = class AppGateway {
    constructor(prisma) {
        this.prisma = prisma;
        this.userGameMap = {};
        this.users = [];
        this.invitations = [];
        this.games = {};
    }
    handleConnection(client) {
        const ft_id = client.handshake.query.id;
        const login = client.handshake.query.login;
        const alreadyLogin = this.users.find(socketUser => socketUser.ft_id === ft_id);
        if (alreadyLogin)
            return this.sendMessageToClient(client.id, "alreadyLoggedIn", {});
        console.log(`Now online : ${login}`);
        const user = new user_class_1.User(client.id, ft_id, login, 'none');
        this.users.push(user);
        for (let user of this.users)
            this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
                return { userId: user.ft_id, status: user.status };
            }));
    }
    handleDisconnect(client) {
        const socketUser = this.users.find(socketUser => socketUser.id === client.id);
        if (!socketUser)
            return;
        this.users.splice(this.users.indexOf(socketUser), 1);
        for (let user of this.users)
            this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
                return { userId: user.ft_id, status: user.status };
            }));
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
            if (game.property.statusGame) {
                this.handleStop(client, "playerLeft");
                console.log(`Game ${gameId} removed because player left.`);
            }
            this.sendMessageToGame(game, "returnToMenu", "playerLeft");
        }
    }
    handleInfosUser(client, data) {
        const user = this.users.find(u => u.id === client.id);
        if (user) {
            user.login = data.name;
        }
    }
    async handleMatchmakingEvent(client) {
        console.log(`Received 'matchmaking' event from client: ${this.users.find(e => e.id == client.id).login}`);
        const user = this.users.find(u => u.id === client.id);
        let sameUser = false;
        if (user) {
            let availableGameId;
            for (const gameId in this.games) {
                if (this.games[gameId].players.length < 2) {
                    availableGameId = gameId;
                    if (this.games[gameId].players[0].id === client.id) {
                        sameUser = true;
                    }
                    if (this.games[gameId].players[0].side === 'players1') {
                        user.side = 'players2';
                        this.games[availableGameId].paddles.player2.userName = user.login;
                    }
                    else {
                        user.side = 'players1';
                        this.games[availableGameId].paddles.player1.userName = user.login;
                    }
                    break;
                }
            }
            if (!availableGameId) {
                const newGame = new game_class_1.Game(this.server, () => this.handleStop(client, "jsp"), this.prisma, this.users);
                availableGameId = this.generateUniqueId();
                this.games[availableGameId] = newGame;
                user.side = 'players1';
                this.games[availableGameId].paddles.player1.userName = user.login;
            }
            if (!sameUser && !this.games[availableGameId].property.statusGame) {
                this.games[availableGameId].players.push(user);
                this.userGameMap[user.id] = availableGameId;
                client.emit('playerJoined', `You joined Game ${availableGameId}`);
            }
            if (this.games[availableGameId].players.length === 2) {
                const game = this.games[availableGameId];
                const user1 = await this.prisma.user.findUnique({ where: { id: game.players[0].ft_id } });
                const user2 = await this.prisma.user.findUnique({ where: { id: game.players[1].ft_id } });
                this.sendMessageToGame(game, 'userList', [user1, user2]);
            }
        }
    }
    handlePlayEvent(client) {
        const gameId = this.userGameMap[client.id];
        let Time = 5;
        if (this.games[gameId].property.intervalTimer) {
            clearInterval(this.games[gameId].property.intervalTimer);
        }
        if (this.games[gameId].property.timeoutId) {
            clearTimeout(this.games[gameId].property.timeoutId);
        }
        this.sendMessageToGame(this.games[gameId], "timeBeforePlay", Time);
        this.games[gameId].property.intervalTimer = setInterval(() => {
            Time -= 1;
            this.sendMessageToGame(this.games[gameId], "timeBeforePlay", Time);
        }, 1000);
        this.games[gameId].property.timeoutId = setTimeout(() => {
            if (this.games[gameId]) {
                if (this.games[gameId]?.players.length === 2) {
                    this.games[gameId].startGameLoop();
                    this.sendMessageToClient(this.games[gameId].players[0].id, "drawLeft", {});
                    this.sendMessageToClient(this.games[gameId].players[1].id, "drawRight", {});
                    this.sendMessageToGame(this.games[gameId], "partieLaunch", "go");
                    for (let player of this.games[gameId]?.players)
                        this.users.find(socketUser => socketUser.id == player.id).status = user_class_1.UserStatus.PLAYING;
                    for (let user of this.users)
                        this.sendMessageToClient(user.id, "usersStatus", this.users.map(user => {
                            return { userId: user.ft_id, status: user.status };
                        }));
                }
            }
            clearInterval(this.games[gameId].property.intervalTimer);
        }, 5000);
    }
    handleLeftMatchMaking(client) {
        const gameId = this.userGameMap[client.id];
        if (!gameId || !this.games[gameId])
            return;
        clearInterval(this.games[gameId].property.intervalTimer);
        clearTimeout(this.games[gameId].property.timeoutId);
        const game = this.games[gameId];
        const playerIndex = game.players.findIndex(player => player.id === client.id);
        const otherPlayerIndex = playerIndex === 0 ? 1 : 0;
        const otherPlayer = game.players[otherPlayerIndex];
        console.log(otherPlayer, otherPlayerIndex);
        if (otherPlayer) {
            console.log("envoie à", otherPlayer.login);
            this.sendMessageToClient(otherPlayer.id, "returnToMenu", "playerLeft");
        }
        if (playerIndex !== -1) {
            const leftPlayer = game.players.splice(playerIndex, 1)[0];
            delete this.userGameMap[client.id];
            console.log("delete this user", client.id);
        }
        if (game.players.length === 0) {
            delete this.games[gameId];
            console.log(`Le jeu ${gameId} a été supprimé car il ne reste plus de joueurs.`);
        }
    }
    handleStop(client, infos) {
        const gameId = this.userGameMap[client.id];
        if (this.games[gameId]) {
            if (infos != "timer") {
                this.sendMessageToGame(this.games[gameId], "stop", "stop");
            }
            else {
                const userNotSentStop = this.games[gameId].players.find(user => user.id !== client.id);
                this.sendMessageToClient(userNotSentStop.id, "stop", "stop");
            }
            if (this.games[gameId].property.countdown >= 1)
                this.games[gameId].stopGameLoop();
            this.removeGame(client.id);
        }
    }
    handleArrowUp(client) {
        const gameId = this.userGameMap[client.id];
        this.games[gameId]?.arrowUp(client.id);
    }
    handleArrowDown(client) {
        const gameId = this.userGameMap[client.id];
        this.games[gameId]?.arrowDown(client.id);
    }
    handleSetBonus(client, value) {
        const gameId = this.userGameMap[client.id];
        if (value == 0)
            this.games[gameId].paddles.height -= 50;
        else if (value == 2)
            this.games[gameId].paddles.height += 50;
        this.sendMessageToGame(this.games[gameId], "bonus", value);
    }
    ;
    async swicthedChannel(client, data) {
        try {
            let user = this.users.find(user => user.id == client.id);
            user.currentChannel = data.channelId;
            user.currentDMChannel = "";
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du changement de salon d'un utilisateur");
        }
    }
    async swicthedDMChannel(client, data) {
        try {
            let user = this.users.find(user => user.id == client.id);
            user.currentDMChannel = data.dmchannelId;
            user.currentChannel = "";
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du changement de dm d'un utilisateur");
        }
    }
    async sendChannelMessage(client, data) {
        try {
            let message = await this.prisma.message.create({
                data: { content: data.messageContent, senderId: data.userId, channelId: data.channelId },
                include: { channel: { include: { messages: { include: { sender: true } }, owner: true, admins: true, users: { include: { friends: { include: { bannedFrom: true } }, friendship1: true, friendship2: true, bannedFrom: true } }, muted: { include: { user: true } }, banned: true } } }
            });
            let users = this.users.filter(user => {
                return message.channel.users.find(u => u.id == user.ft_id) && user.currentChannel == data.channelId;
            });
            for (let user of users) {
                this.sendMessageToClient(user.id, "messageReceiveInChannel", { channel: message.channel });
            }
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de tous les utilisateurs dans un salon");
        }
    }
    async sendDMChannelMessage(client, data) {
        try {
            let message = await this.prisma.message.create({
                data: { content: data.messageContent, senderId: data.userId, dmchannelId: data.dmchannelId },
                include: { dmchannel: { include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } } } }
            });
            let users = this.users.filter(user => {
                return [message.dmchannel.user1id, message.dmchannel.user2id].includes(user.ft_id);
            });
            for (let user of users) {
                this.sendMessageToClient(user.id, "messageReceiveInDMChannel", { dmchannel: message.dmchannel });
            }
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de la récupération de tous les utilisateurs dans un salon");
        }
    }
    async blockUser(client, data) {
        try {
            let userBlocked = this.users.find(user => user.ft_id == data.blockedId);
            if (!userBlocked)
                return;
            let dmchannel = await this.prisma.dMChannel.findUnique({
                where: { user1id_user2id: { user1id: data.blockerId, user2id: data.blockedId } },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            if (!dmchannel)
                dmchannel = await this.prisma.dMChannel.findUnique({
                    where: { user1id_user2id: { user1id: data.blockedId, user2id: data.blockerId } },
                    include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
                });
            let user = await this.prisma.user.findUnique({
                where: { id: data.blockedId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(userBlocked.id, "hasBeenBlocked", { dmchannel, user });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du blocage d'un utilisateur par un autre");
        }
    }
    async unblockUser(client, data) {
        try {
            let userBlocked = this.users.find(user => user.ft_id == data.blockedId);
            if (!userBlocked)
                return;
            let dmchannel = await this.prisma.dMChannel.findUnique({
                where: { user1id_user2id: { user1id: data.blockerId, user2id: data.blockedId } },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            if (!dmchannel)
                dmchannel = await this.prisma.dMChannel.findUnique({
                    where: { user1id_user2id: { user1id: data.blockedId, user2id: data.blockerId } },
                    include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
                });
            let user = await this.prisma.user.findUnique({
                where: { id: data.blockedId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(userBlocked.id, "hasBeenUnblocked", { dmchannel, user });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du blocage d'un utilisateur par un autre");
        }
    }
    async removeUserFromChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId);
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenRemovedFromChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async removeAdminFromAdmins(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "adminHasBeenRemovedFromAdmins", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async banUserFromChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId);
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenBannedFromChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async unbanUserFromChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id) || socketUser.ft_id == data.userId);
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenUnbannedFromChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async muteUserInChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenMutedInChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async unmuteUserInChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenUnmutedInChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async deleteChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "channelHasBeenDeleted", { channel: data.channel });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de kick d'un utilisateur d'un channel");
        }
    }
    async ownerLeaveChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "ownerHasLeavedChannel", { channel: data.channel });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du départ du fondateur du salon");
        }
    }
    async userLeaveChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasLeavedChannel", { channel: data.channel });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors du départ d'un utilisateur du salon");
        }
    }
    async addAdminToChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "adminHasBeenAddedToChannel", { channel: data.channel });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un administrateur");
        }
    }
    async addUserToChannel(client, data) {
        try {
            let users = this.users.filter(socketUser => data.channel.users.find((user) => user.id == socketUser.ft_id));
            for (let user of users)
                this.sendMessageToClient(user.id, "userHasBeenAddedToChannel", { channel: data.channel, userId: data.userId });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un administrateur");
        }
    }
    async channelPasswordChanged(client, data) {
        try {
            let users = this.users;
            for (let user of users)
                this.sendMessageToClient(user.id, "channelPasswordHasChanged", { channel: data.channel });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un administrateur");
        }
    }
    async getUsersStatus(client) {
        try {
            this.sendMessageToClient(client.id, "usersStatus", this.users.map(user => {
                return { userId: user.ft_id, status: user.status };
            }));
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'ajout d'un administrateur");
        }
    }
    async sendFriendRequest(client, data) {
        try {
            let socketUser = this.users.find(socketUser => socketUser.ft_id === data.userId);
            if (!socketUser)
                return;
            let user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(socketUser.id, "receiveFriendRequest", { friendship: data.friendship, user });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'envoie d'une demande d'ami");
        }
    }
    async acceptFriendRequest(client, data) {
        try {
            let acceptUser = this.users.find(socketUser => socketUser.ft_id === data.userId);
            if (!acceptUser)
                return;
            let socketUser = this.users.find(socketUser => socketUser.id == client.id);
            let dmchannel = await this.prisma.dMChannel.findUnique({
                where: { user1id_user2id: { user1id: acceptUser.ft_id, user2id: socketUser.ft_id } },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            if (!dmchannel)
                dmchannel = await this.prisma.dMChannel.findUnique({
                    where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: acceptUser.ft_id } },
                    include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
                });
            let user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(acceptUser.id, "friendRequestAccepted", { dmchannel, user, login: socketUser.login });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'envoie d'une demande d'ami");
        }
    }
    async declineFriendRequest(client, data) {
        try {
            let declinedUser = this.users.find(socketUser => socketUser.ft_id === data.userId);
            if (!declinedUser)
                return;
            let socketUser = this.users.find(socketUser => socketUser.id === client.id);
            let dmchannel = await this.prisma.dMChannel.findUnique({
                where: { user1id_user2id: { user1id: declinedUser.ft_id, user2id: socketUser.ft_id } },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            if (!dmchannel)
                dmchannel = await this.prisma.dMChannel.findUnique({
                    where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: declinedUser.ft_id } },
                    include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
                });
            let user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(declinedUser.id, "friendRequestDeclined", { dmchannel, user });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'envoie d'une demande d'ami");
        }
    }
    async removeFriend(client, data) {
        try {
            let userRemoved = this.users.find(socketUser => socketUser.ft_id === data.userId);
            if (!userRemoved)
                return;
            let socketUser = this.users.find(socketUser => socketUser.id == client.id);
            let dmchannel = await this.prisma.dMChannel.findUnique({
                where: { user1id_user2id: { user1id: userRemoved.ft_id, user2id: socketUser.ft_id } },
                include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
            });
            if (!dmchannel)
                dmchannel = await this.prisma.dMChannel.findUnique({
                    where: { user1id_user2id: { user1id: socketUser.ft_id, user2id: userRemoved.ft_id } },
                    include: { user1: { include: { friendship1: true, friendship2: true } }, user2: { include: { friendship1: true, friendship2: true } }, messages: { include: { sender: true } } }
                });
            let user = await this.prisma.user.findUnique({
                where: { id: data.userId },
                include: { friends: { include: { dmchannel1: true, dmchannel2: true, bannedFrom: true } }, friendship1: { include: { user1: true, user2: true } }, friendship2: { include: { user1: true, user2: true } }, dmchannel1: true, dmchannel2: true, blockedUsers: true, blockedBy: true, bannedFrom: true }
            });
            this.sendMessageToClient(userRemoved.id, "friendHasBeenRemoved", { dmchannel, user });
        }
        catch (error) {
            console.error(error);
            throw new Error("Erreur lors de l'envoie d'une demande d'ami");
        }
    }
    async getGameInvitation(client, data) {
        const invitation = this.invitations.find(invitation => invitation.inviterId === data.userId || invitation.invitedId === data.userId);
        if (!invitation)
            return;
        const inviter = await this.prisma.user.findUnique({ where: { id: invitation.inviterId } });
        const invited = await this.prisma.user.findUnique({ where: { id: invitation.invitedId } });
        this.sendMessageToClient(client.id, "gameInvitationList", { inviter, invited });
    }
    async gameInvitationSent(client, data) {
        const userInviter = this.users.find(e => e.ft_id === data.inviterId);
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
        const inviter = await this.prisma.user.findUnique({ where: { id: data.inviterId } });
        if (!inviter)
            return;
        this.invitations.push({ inviterId: data.inviterId, invitedId: data.invitedId });
        this.sendMessageToClient(userInvited.id, "gameInvitationReceived", inviter);
    }
    async gameInvitationCancel(client, data) {
        this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
        const userInvited = this.users.find(socketUser => socketUser.ft_id == data.invitedId);
        if (userInvited)
            this.sendMessageToClient(userInvited.id, "gameInvitationCancelled", {});
    }
    async gameInvitationAccept(client, data) {
        this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
        const socketUserInviter = this.users.find(socketUser => socketUser.ft_id === data.inviterId);
        const socketUserInvited = this.users.find(socketUser => socketUser.ft_id === data.invitedId);
        const userInviter = await this.prisma.user.findUnique({ where: { id: socketUserInviter.ft_id } });
        const userInvited = await this.prisma.user.findUnique({ where: { id: socketUserInvited.ft_id } });
        const game = new game_class_1.Game(this.server, () => this.handleStop(client, "jsp"), this.prisma, this.users);
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
        for (let id of [socketUserInviter.id, socketUserInvited.id])
            this.sendMessageToClient(id, "userList", [userInviter, userInvited]);
    }
    async gameInvitationDecline(client, data) {
        this.invitations.splice(this.invitations.findIndex(invitation => invitation.inviterId == data.inviterId), 1);
        const userInviter = this.users.find(socketUser => socketUser.ft_id == data.inviterId);
        console.log(userInviter);
        if (userInviter)
            this.sendMessageToClient(userInviter.id, "gameInvitationDeclined", {});
    }
    sendMessageToClient(clientId, event, message) {
        this.server.to(clientId).emit(event, message);
    }
    sendMessageToGame(game, where, object) {
        if (game)
            game.players.forEach(player => {
                this.server.to(player.id).emit(where, object);
            });
    }
    removeGame(clientId) {
        const gameId = this.userGameMap[clientId];
        delete this.games[gameId];
    }
    ;
    generateUniqueId() {
        return Math.random().toString(36).substring(2, 9);
    }
};
exports.AppGateway = AppGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], AppGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('infosUser'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleInfosUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('matchmaking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "handleMatchmakingEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('play'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handlePlayEvent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leftMatchmaking'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleLeftMatchMaking", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('stop'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, String]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleStop", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ArrowUp'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleArrowUp", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ArrowDown'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleArrowDown", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('Bonus'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Number]),
    __metadata("design:returntype", void 0)
], AppGateway.prototype, "handleSetBonus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("switchedChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "swicthedChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("switchedDMChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "swicthedDMChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("sendChannelMessage"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "sendChannelMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("sendDMChannelMessage"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "sendDMChannelMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("blockUser"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "blockUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unblockUser"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "unblockUser", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("removeUserFromChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "removeUserFromChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("removeAdminFromAdmins"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "removeAdminFromAdmins", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("banUserFromChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "banUserFromChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unbanUserFromChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "unbanUserFromChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("muteUserInChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "muteUserInChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("unmuteUserInChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "unmuteUserInChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("deleteChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "deleteChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("ownerLeaveChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "ownerLeaveChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("userLeaveChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "userLeaveChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("addAdminToChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "addAdminToChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("addUserToChannel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "addUserToChannel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("channelPasswordChanged"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "channelPasswordChanged", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getUsersStatus"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "getUsersStatus", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("sendFriendRequest"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "sendFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("acceptFriendRequest"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "acceptFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("declineFriendRequest"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "declineFriendRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("removeFriend"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "removeFriend", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("getGameInvitation"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "getGameInvitation", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("gameInvitationSent"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "gameInvitationSent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("gameInvitationCancel"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "gameInvitationCancel", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("gameInvitationAccept"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "gameInvitationAccept", null);
__decorate([
    (0, websockets_1.SubscribeMessage)("gameInvitationDecline"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", Promise)
], AppGateway.prototype, "gameInvitationDecline", null);
exports.AppGateway = AppGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(Number(process.env.SOCKET_PORT)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AppGateway);
//# sourceMappingURL=app.gateway.js.map