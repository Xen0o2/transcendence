import { DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
export declare class DmchannelController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    dmChannel(DMChannelWhereUnique: Prisma.DMChannelWhereUniqueInput): Promise<DMChannel | null>;
    dmChannels(DMChannelWhereInput: Prisma.DMChannelWhereInput): Promise<DMChannel[]>;
    update(DMChannelUpdateInput: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null>;
    create(data: Prisma.DMChannelCreateInput): Promise<DMChannel>;
    delete(DMChannelWhereUnique: Prisma.DMChannelWhereUniqueInput): Promise<DMChannel | null>;
    deleteFriendship(friendshipWhereUnique: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null>;
    updateUser(userUpdateInput: Prisma.UserUpdateArgs): Promise<User | null>;
    createDMChannel(userData: any): Promise<DMChannel | null>;
    getDMChannels(userId: string): Promise<DMChannel[] | null>;
    blockUser(dmchannelId: string, blockerId: string): Promise<DMChannel | null>;
    unblockUser(dmchannelId: string): Promise<DMChannel | null>;
}
