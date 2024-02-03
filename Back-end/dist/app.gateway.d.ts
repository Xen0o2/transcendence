import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Friendship } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from './prisma/prisma.service';
import { Game } from './sockets/game.class';
import { User } from './sockets/user.class';
export declare class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private userGameMap;
    server: Server;
    users: User[];
    games: Game[];
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleInfosUser(client: Socket, data: {
        name: string;
    }): void;
    handleMatchmakingEvent(client: Socket): void;
    handlePlayEvent(client: Socket): void;
    handleLeftMatchMaking(client: Socket): void;
    handleStop(client: Socket, infos: any): void;
    handleArrowUp(client: Socket): void;
    handleArrowDown(client: Socket): void;
    handleSetBonus(client: Socket, infos: any): void;
    swicthedChannel(client: Socket, data: {
        channelId: string;
    }): Promise<void>;
    swicthedDMChannel(client: Socket, data: {
        dmchannelId: string;
    }): Promise<void>;
    sendChannelMessage(client: Socket, data: {
        channelId: string;
        userId: string;
        messageContent: string;
    }): Promise<void>;
    sendDMChannelMessage(client: Socket, data: {
        dmchannelId: string;
        userId: string;
        messageContent: string;
    }): Promise<void>;
    blockUser(client: Socket, data: {
        blockerId: string;
        blockedId: string;
    }): Promise<void>;
    unblockUser(client: Socket, data: {
        blockerId: string;
        blockedId: string;
    }): Promise<void>;
    removeUserFromChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    removeAdminFromAdmins(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    banUserFromChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    unbanUserFromChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    muteUserInChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    unmuteUserInChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    deleteChannel(client: Socket, data: {
        channel: any;
    }): Promise<void>;
    ownerLeaveChannel(client: Socket, data: {
        channel: any;
    }): Promise<void>;
    userLeaveChannel(client: Socket, data: {
        channel: any;
    }): Promise<void>;
    addAdminToChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    addUserToChannel(client: Socket, data: {
        channel: any;
        userId: string;
    }): Promise<void>;
    channelPasswordChanged(client: Socket, data: {
        channel: any;
    }): Promise<void>;
    getUsersStatus(client: Socket): Promise<void>;
    sendFriendRequest(client: Socket, data: {
        friendship: Friendship;
        userId: string;
    }): Promise<void>;
    acceptFriendRequest(client: Socket, data: {
        userId: string;
    }): Promise<void>;
    declineFriendRequest(client: Socket, data: {
        userId: string;
    }): Promise<void>;
    removeFriend(client: Socket, data: {
        userId: string;
    }): Promise<void>;
    sendMessageToClient(clientId: string, event: string, message: any): void;
    sendMessageToGame(game: any, where: string, object: any): void;
    removeGame(clientId: string): any;
    private generateUniqueId;
}
