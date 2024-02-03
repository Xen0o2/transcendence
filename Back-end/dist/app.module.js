"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const api_service_1 = require("./api/api.service");
const user_controller_1 = require("./user/user.controller");
const axios_1 = require("@nestjs/axios");
const prisma_service_1 = require("./prisma/prisma.service");
const channel_controller_1 = require("./channel/channel.controller");
const friendship_controller_1 = require("./friendship/friendship.controller");
const dmchannel_controller_1 = require("./dmchannel/dmchannel.controller");
const platform_express_1 = require("@nestjs/platform-express");
const serve_static_1 = require("@nestjs/serve-static");
const app_gateway_1 = require("./app.gateway");
const images_controller_1 = require("./images/images.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            platform_express_1.MulterModule.register({
                dest: './uploads',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: __dirname + "/../uploads",
                serveRoot: "/uploads"
            })
        ],
        controllers: [app_controller_1.AppController, user_controller_1.UserController, channel_controller_1.ChannelController, friendship_controller_1.FriendshipController, dmchannel_controller_1.DmchannelController, images_controller_1.ImagesController],
        providers: [app_service_1.AppService, api_service_1.ApiService, prisma_service_1.PrismaService, app_gateway_1.AppGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map