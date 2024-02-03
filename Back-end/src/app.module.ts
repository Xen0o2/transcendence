import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiService } from './api/api.service';
import { UserController } from './user/user.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaService } from './prisma/prisma.service';
import { ChannelController } from './channel/channel.controller';
import { FriendshipController } from './friendship/friendship.controller';
import { DmchannelController } from './dmchannel/dmchannel.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ServeStaticModule } from "@nestjs/serve-static"

import { AppGateway } from './app.gateway';
import { ImagesController } from './images/images.controller';

@Module({
  imports: [
    HttpModule,
    MulterModule.register({
      dest: './uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: __dirname + "/../uploads",
      serveRoot: "/uploads"
    })
  ],
  controllers: [AppController, UserController, ChannelController, FriendshipController, DmchannelController, ImagesController],
  providers: [AppService, ApiService, PrismaService, AppGateway],
})

export class AppModule {}
