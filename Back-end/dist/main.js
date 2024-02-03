"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: `${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true
    });
    const io = require('socket.io')(app.getHttpServer(), {
        cors: {
            origin: `${process.env.FRONTEND_URL}:${process.env.FRONTEND_PORT}`,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(io));
    app.enableCors();
    await app.listen(process.env.BACKEND_PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map