import { Body, Controller, Param, Post, Delete } from '@nestjs/common';
import { User } from '@prisma/client';
import * as nodemailer from "nodemailer"
import { PrismaService } from 'src/prisma/prisma.service';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'TranscendenceMulhouse@gmail.com',
        pass: process.env.MAIL_PASSWORD,
    },
});

function generateRandomCode() {
    const min = 100000;
    const max = 999999;
    const randomCode = Math.floor(Math.random() * (max - min + 1)) + min;
  
    return randomCode.toString();
  }

const codes = {};

@Controller('mail')
export class MailController {
    constructor(
		private prisma: PrismaService
	) {}

    @Post("verify/:userId")
    async verify(@Body() { mail }: { mail: string }, @Param("userId") userId: string) {
        try {
            const code = generateRandomCode();
            const mailOptions = {
                from: 'TranscendenceMulhouse@gmail.com',
                to: mail,
                subject: '2 Factor Authentication',
                text: code,
            };
            codes[userId] = code;
            await transporter.sendMail(mailOptions);
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de l'envoie du code par mail");
        }
    }

    @Post("verify/:userId/:code")
    async verifyCode(@Param("userId") userId: string, @Param("code") code: string, @Body() { mail }: { mail: string }) {
        try {
            let validCode = codes[userId];
            if (validCode == parseInt(code)) {
                await this.prisma.user.update({
                    data: { mail },
                    where: { id: userId }
                })
                delete codes[userId];
                return ({status: 200, message: "Successful a2f verification"})
            } else {
                return ({status: 403, message: "Failed a2f verification"})
            }
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la vérification du code d'un utilisateur")
        }
    }
    
    @Delete("disable/:userId")
    async disable2fa(@Param("userId") userId: string): Promise<User | null> {
        try {
            let user = await this.prisma.user.update({
                data: { mail: null },
                where: { id: userId }
            })
            return user;
        } catch(error) {
            console.error(error)
            throw new Error("Erreur lors de la désactivation de l'a2f d'un utilisateur")
        }
    }
}

