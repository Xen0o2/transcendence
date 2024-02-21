import { BadRequestException, Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from "express"
import * as path from "path"
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

@Controller('images')
export class ImagesController {

    constructor(
        private readonly prisma: PrismaService
    ){}

    @Get(":filename")
    async getUploads(@Param("filename") filename: string, @Res() res: Response) {
        const file = path.join(__dirname, "..", "..", "uploads", filename)
        return res.sendFile(file);
    }

    @Post('upload/:userId')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: ImageFile, @Param("userId") userId: string) {
        const extensions = ["jpg", "jpeg", "png", "webp", "gif"]
        if (!extensions.some(extension => file.originalname.toLowerCase().endsWith(extension)))
            throw new BadRequestException("File is not an image")
        
            await this.prisma.user.update({
            data: { image: `${process.env.BACKEND_URL}:${process.env.BACKEND_PORT}/${file.path}`},
            where: { id: userId }
        })
        return file.filename
    }
}
