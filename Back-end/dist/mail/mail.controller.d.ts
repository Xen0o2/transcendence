import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
export declare class MailController {
    private prisma;
    constructor(prisma: PrismaService);
    verify({ mail }: {
        mail: string;
    }, userId: string): Promise<void>;
    verifyCode(userId: string, code: string, { mail }: {
        mail: string;
    }): Promise<{
        status: number;
        message: string;
    }>;
    disable2fa(userId: string): Promise<User | null>;
}
