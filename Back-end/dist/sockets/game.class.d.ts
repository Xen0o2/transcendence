/// <reference types="node" />
import { PrismaService } from "src/prisma/prisma.service";
import { User } from "./user.class";
export declare class Game {
    private readonly prisma;
    users: User[];
    players: User[];
    gameLoopInterval: NodeJS.Timeout | null;
    property: {
        height: number;
        width: number;
        ballRay: number;
        lastedTouch: number;
        goalStatus: number;
        statusGame: boolean;
        gameTimer: any;
        gameTime: number;
        countdown: number;
        intervalTimer: any;
        timeoutId: any;
        ballPause: boolean;
    };
    paddles: {
        speed: number;
        width: number;
        height: number;
        player1: {
            x: number;
            y: number;
            score: number;
            userName: any;
        };
        player2: {
            x: number;
            y: number;
            score: number;
            userName: any;
        };
    };
    ball: any;
    io: any;
    onStopCallback: ((arg: string) => void) | null;
    constructor(io: any, onStopCallback: ((arg: any) => void) | null, prisma: PrismaService, users: User[]);
    startGameLoop(data: any): void;
    stopGameLoop(): Promise<void>;
    updateGame(): void;
    sendGameStateToClients(): void;
    ballPhysics(): void;
    PaddleColision(): void;
    BallMovement(Paddle: any): void;
    resetBallStats(): void;
    setScore(): void;
    WallColision(): void;
    arrowUp(playerId: string): void;
    arrowDown(playerId: string): void;
    startGameTimer(): void;
    stopGameTimer(): void;
    updateCountdown(): void;
}
