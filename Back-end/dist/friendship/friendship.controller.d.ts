import { DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
export declare class FriendshipController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    friendship(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null>;
    friendships(friendshipWhereInput: Prisma.FriendshipWhereInput): Promise<Friendship[] | null>;
    update(friendshipUpdateInput: Prisma.FriendshipUpdateArgs): Promise<Friendship | null>;
    addFriend(userUpdateArgs: Prisma.UserUpdateArgs): Promise<User | null>;
    updateDMChannel(dmchannelUpdateArgs: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null>;
    create(data: Prisma.FriendshipCreateInput): Promise<Friendship>;
    delete(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null>;
    createFriendship(userData: any): Promise<Friendship | null>;
    acceptFriendRequest(id: string): Promise<Friendship | null>;
    declineFriendRequest(friendshipId: string): Promise<Friendship | null>;
    getAcceptedFriendship(userId: string): Promise<Friendship[] | null>;
    getPendingFriendship(userId: string): Promise<Friendship[] | null>;
    getFriendship(friendshipId: number): Promise<Friendship | null>;
    deleteFriendship(friendshipId: number): Promise<Friendship | null>;
}
