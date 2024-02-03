import { DMChannel, Friendship, Prisma, User } from '@prisma/client';
import { ApiService } from 'src/api/api.service';
import { PrismaService } from 'src/prisma/prisma.service';
export declare class UserController {
    private readonly apiService;
    private prisma;
    constructor(apiService: ApiService, prisma: PrismaService);
    user(userWhereUniqueInput: Prisma.UserWhereUniqueInput): Promise<User | null>;
    users(userWhereInput: Prisma.UserWhereInput): Promise<User[] | null>;
    createUser(data: Prisma.UserCreateInput): Promise<User>;
    update(UserUpdateInput: Prisma.UserUpdateArgs): Promise<User | null>;
    updateDMChannel(DMChannelUpdateInput: Prisma.DMChannelUpdateArgs): Promise<DMChannel | null>;
    deleteFriendship(friendshipWhereUniqueInput: Prisma.FriendshipWhereUniqueInput): Promise<Friendship | null>;
    loginUser(code: string): Promise<User | null>;
    changeUsername(userId: string, userData: any): Promise<User | null>;
    getOtherUsers(userId: string): Promise<User[]>;
    getUsersWithUsername(searchUsername: string): Promise<User[] | null>;
    getUser(userId: string): Promise<User | null>;
    getUserRank(userId: string): Promise<number>;
    deblockUser(blockerId: string, blockedId: string): Promise<User | null>;
    removeFriend(userId: string, friendId: string): Promise<User | null>;
}
