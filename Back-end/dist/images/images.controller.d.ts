import { Response } from "express";
import { PrismaService } from 'src/prisma/prisma.service';
interface ImageFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}
export declare class ImagesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUploads(filename: string, res: Response): Promise<void>;
    uploadFile(file: ImageFile, userId: string): Promise<string>;
}
export {};
