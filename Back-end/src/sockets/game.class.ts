import { PrismaService } from 'src/prisma/prisma.service';
import { User, UserStatus } from './user.class';

export class Game {
  users: User[];
  players: User[] = [];

  gameLoopInterval: NodeJS.Timeout | null = null;

  property = {
    height: 850,
    width: 1200,
    ballRay: 10,
    lastedTouch: 1,
    goalStatus: 1,
    statusGame: false,
    gameTimer: null,
    gameTime: 0,
    countdown: 3000,
    intervalTimer: null,
    timeoutId: null,
    ballPause: false,
  };

  paddles = {
    speed: 10,
    width: 15,
    height: 100,
    player1: {
      x: 0,
      y: this.property.height / 2 - 50,
      score: 0,
      userName: null,
      height: undefined,
    },
    player2: {
      x: this.property.width - 15,
      y: this.property.height / 2 - 50,
      score: 0,
      userName: null,
      height: undefined,
    },
  };

  ball: any = {
    x: this.property.width / 2,
    y: this.property.height / 2,
    ray: 10,
    ballDirY: 0,
    ballVelocity: 4.4,
    ballDirX: 2 * (this.property.width / 720),
    ballColor: 'white',
    ballStroke: 'black',
  };

  bonus = {
    x: 0,
    y: 0,
    x2: 0,
    y2: 0,
    ray: 0,
    bonusType: -1,

    bonusIsHere: false,
    BonusOn: false,
    BonusStatus: false,
    BonusIsHere: false,
    TeleportEffect: false,
    InvisibleBall: false,
    SpeedEffect: false,
    RandomYEffect: false,
  };

  io: any;
  onStopCallback: ((arg: string) => void) | null = null;
  socket: any;

  constructor(
    io: any,
    onStopCallback: ((arg: any) => void) | null = null,
    private readonly prisma: PrismaService,
    users: User[],
  ) {
    this.io = io;
    this.onStopCallback = onStopCallback;
    this.users = users;
  }

  startGameLoop(data: any) {
    void data;
    this.property.statusGame = true;
    if (this.property.statusGame === true) {
      if (this.gameLoopInterval === null) {
        this.gameLoopInterval = setInterval(
          function () {
            this.updateGame();
            this.sendGameStateToClients();
          }.bind(this),
          1000 / 60,
        );
      }
    }
  }

  async stopGameLoop() {
    this.property.statusGame = true;

    if (this.players.length == 0) return;
    for (const player of this.players) player.status = UserStatus.ONLINE;
    for (const user of this.users)
      this.io.to(user.id).emit(
        'usersStatus',
        this.users.map((user) => {
          return { userId: user.ft_id, status: user.status };
        }),
      );

    this.players.forEach((user) => {
      // ENVOIE LE SCORE A TOUT LE MONDE
      this.io.to(user.id).emit('score', this.paddles);
    });

    if (this.gameLoopInterval !== null) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;

      const match = await this.prisma.match.create({
        data: {
          user1id: this.players[0].ft_id,
          user2id: this.players[1].ft_id,
          scoreUser1: this.paddles.player1.score,
          scoreUser2: this.paddles.player2.score,
          winnerid:
            this.paddles.player1.score == this.paddles.player2.score
              ? null
              : this.paddles.player1.score > this.paddles.player2.score
                ? this.players[0].ft_id
                : this.players[1].ft_id,
        },
      });

      const experienceToAdd = 100; // level * 1000 / 3 pour passer un niveau
      const user1 = await this.prisma.user.update({
        data: {
          victory: {
            increment: Number(match.winnerid === this.players[0].ft_id),
          },
          defeat: {
            increment: Number(match.winnerid === this.players[1].ft_id),
          },
          experience: {
            increment: Number(match.winnerid === this.players[0].ft_id)
              ? experienceToAdd * 2
              : experienceToAdd / 2,
          },
        },
        where: { id: this.players[0].ft_id },
      });
      if (user1.experience >= (user1.level * 1000) / 3)
        await this.prisma.user.update({
          data: { level: { increment: 1 }, experience: 0 },
          where: { id: user1.id },
        });
      const user2 = await this.prisma.user.update({
        data: {
          victory: {
            increment: Number(match.winnerid === this.players[1].ft_id),
          },
          defeat: {
            increment: Number(match.winnerid === this.players[0].ft_id),
          },
          experience: {
            increment: Number(match.winnerid === this.players[1].ft_id)
              ? experienceToAdd * 2
              : experienceToAdd / 2,
          },
        },
        where: { id: this.players[1].ft_id },
      });
      if (user2.experience >= (user2.level * 1000) / 3)
        await this.prisma.user.update({
          data: { level: { increment: 1 }, experience: 0 },
          where: { id: user2.id },
        });

      if (this.onStopCallback !== null) {
        this.onStopCallback('timer');
      }
    }
  }

  updateGame() {
    this.ballPhysics();
    this.updateCountdown();
  }

  sendGameStateToClients() {
    const gameState = {
      paddles: this.paddles,
      ball: this.ball,
      property: this.property,
      bonus: this.bonus,
    };
    this.players.forEach((user) => {
      this.io.to(user.id).emit('gameState', gameState);
    });
  }

  ballPhysics() {
    this.PaddleColision();
    this.WallColision();
    this.BonusCollision();

    if (!this.property.ballPause) {
      this.ball.x += this.ball.ballDirX * this.ball.ballVelocity;
      this.ball.y += this.ball.ballDirY;
    }
  }

  rgba(r: number, g: number, b: number, a: number) {
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  InvisibleBallBonus() {
    this.bonus.BonusOn = true;
    this.ball.BallColor = this.rgba(0, 0, 0, 0);
    this.ball.BallStroke = this.rgba(0, 0, 0, 0);
    this.bonus.InvisibleBall = true;
  }

  getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  RandomYBonus() {
    this.ball.ballDirX =
      1.2 * (this.property.height / 720) * this.property.lastedTouch;
    setTimeout(() => {
      if (this.bonus.RandomYEffect === true) {
        this.ball.ballDirX =
          2.5 * (this.property.height / 720) * this.property.lastedTouch;
        this.ball.ballDirY = this.getRandomInt(-10, 10);
      }
    }, 500);
  }

  SpeedBonus() {
    this.ball.BallVelocity += 1.8;
    this.bonus.BonusOn = true;
    this.bonus.SpeedEffect = true;
  }

  PaddleNerfBonus() {
    this.bonus.BonusOn = true;
    if (this.property.lastedTouch === 1) {
      this.paddles.player2.height =
        this.paddles.height - this.paddles.height / 4;
      this.paddles.player1.height =
        this.paddles.height + this.paddles.height / 6;
    } else if (this.property.lastedTouch === -1) {
      this.paddles.player1.height =
        this.paddles.height - this.paddles.height / 4;
      this.paddles.player2.height =
        this.paddles.height + this.paddles.height / 6;
    }
  }

  TeleportBonus() {
    if (this.ball.BallX >= this.property.width / 2) {
      this.ball.BallX = this.bonus.x;
      this.ball.BallY = this.bonus.y;
    } else {
      this.ball.BallX = this.bonus.x2;
      this.ball.BallY = this.bonus.y2;
    }
    this.ball.BallVelocity = 3;
    this.bonus.TeleportEffect = false;
    this.bonus.bonusType = -1;
  }

  ResetBonusStats(type: number) {
    this.bonus.BonusIsHere = false;
    this.bonus.TeleportEffect = false;
    this.bonus.BonusOn = false;
    if (type === 0) {
      this.ball.BallColor = 'white';
      this.ball.BallStroke = 'black';
      this.bonus.InvisibleBall = false;
    } else if (type === 1) {
      this.ball.BallVelocity -= 1.8;
      this.bonus.SpeedEffect = false;
    } else if (type === 3) {
      this.paddles.player1.height = this.paddles.height;
      this.paddles.player2.height = this.paddles.height;
    } else if (type === 4) {
      this.bonus.RandomYEffect = false;
      this.ball.BallDirX = 2.4;
    }
  }

  LaunchBonus() {
    if (this.bonus.bonusType === 0) this.InvisibleBallBonus();
    else if (this.bonus.bonusType === 1)
      this.SpeedBonus(); // a opti
    else if (this.bonus.bonusType === 2)
      // a opti
      this.TeleportBonus(); // a opti
    else if (this.bonus.bonusType === 3)
      // a opti
      this.PaddleNerfBonus(); // a opti
    else if (this.bonus.bonusType === 4)
      // a opti
      this.RandomYBonus(); // a opti
  }

  BonusCollision() {
    if (this.bonus.BonusIsHere === false) return;

    if (
      this.ball.y + this.ball.ray >= this.bonus.y - this.bonus.ray &&
      this.ball.y - this.ball.ray <= this.bonus.y + this.bonus.ray &&
      this.ball.x + this.ball.ray >= this.bonus.x - this.bonus.ray &&
      this.ball.x - this.ball.ray <= this.bonus.x + this.bonus.ray
    ) {
      this.bonus.BonusIsHere = false;
      this.LaunchBonus();
    } else if (
      this.bonus.TeleportEffect &&
      this.ball.y + this.ball.ray >= this.bonus.y2 - this.ball.ray &&
      this.ball.y - this.ball.ray <= this.bonus.y2 + this.bonus.ray &&
      this.ball.x + this.ball.ray >= this.bonus.x2 - this.bonus.ray &&
      this.ball.x - this.ball.ray <= this.bonus.x2 + this.ball.ray
    ) {
      this.bonus.BonusIsHere = false;
      this.LaunchBonus();
    }
  }

  PaddleColision() {
    const dx1 = Math.abs(
      this.ball.x - this.paddles.player1.x - this.paddles.width / 2,
    );
    const dy1 = Math.abs(
      this.ball.y - this.paddles.player1.y - this.paddles.height / 2,
    );

    const dx2 = Math.abs(
      this.ball.x - this.paddles.player2.x - this.paddles.width / 2,
    );
    const dy2 = Math.abs(
      this.ball.y - this.paddles.player2.y - this.paddles.height / 2,
    );

    if (
      dx1 <= this.property.ballRay + this.paddles.width / 2 &&
      dy1 <= this.paddles.height / 2 + this.property.ballRay
    ) {
      this.BallMovement(this.paddles.player1);
      this.property.lastedTouch = 1;
      if (this.bonus.InvisibleBall === true || this.bonus.SpeedEffect === true)
        this.ResetBonusStats(this.bonus.bonusType);
    } else if (
      dx2 <= this.property.ballRay + this.paddles.width / 2 &&
      dy2 <= this.paddles.height / 2 + this.property.ballRay
    ) {
      this.BallMovement(this.paddles.player2);
      this.ball.ballDirX *= -1;
      this.property.lastedTouch = -1;
      if (this.bonus.InvisibleBall === true || this.bonus.SpeedEffect === true)
        this.ResetBonusStats(this.bonus.bonusType);
    }
  }

  BallMovement(Paddle: any) {
    const ImpactY = (Paddle.y - this.ball.y) * -1;

    if (ImpactY <= this.paddles.height / 5) {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = -3;
    } else if (ImpactY <= (this.paddles.height / 5) * 2) {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = -1;
    } else if (ImpactY <= (this.paddles.height / 5) * 3) {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = 0;
    } else if (ImpactY <= (this.paddles.height / 5) * 4) {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = 0;
    } else if (ImpactY <= this.paddles.height) {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = 3;
    }
  }

  resetBallStats() {
    if (this.bonus.BonusStatus === true) {
      this.ResetBonusStats(0);
      this.ResetBonusStats(1);
      this.ResetBonusStats(3);
      this.ResetBonusStats(4);
    }
    this.ball.ballRay = 10;
    this.ball.ballVelocity = 4.4;
    this.ball.x = this.property.width / 2;
    this.ball.y = this.property.height / 2;
    this.ball.ballDirX =
      2 * (this.property.width / 720) * this.property.lastedTouch;
    this.ball.ballDirY = 0;
    this.paddles.player1.y = this.property.height / 2 - 50;
    this.paddles.player2.y = this.property.height / 2 - 50;
  }

  setScore() {
    if (this.ball.x + this.ball.ray > this.property.width) {
      this.paddles.player1.score += 1;
    } else if (this.ball.x - this.ball.ray < 0) {
      this.paddles.player2.score += 1;
    }
  }

  WallColision() {
    if (
      this.ball.y - this.property.ballRay <= 0 ||
      this.ball.y + this.property.ballRay >= this.property.height
    ) {
      this.ball.ballDirY *= -1;
    } else if (
      this.ball.x + this.property.ballRay >= this.property.width ||
      this.ball.x - this.property.ballRay <= 0
    ) {
      this.setScore();
      this.resetBallStats();
      this.property.ballPause = true;
      setTimeout(() => {
        this.property.ballPause = false;
      }, 500);
    }
  }

  arrowUp(playerId: string) {
    const player = this.players.find((user) => user.id === playerId);
    if (player && this.property.statusGame === true) {
      if (player.side === 'players1') {
        if (this.paddles.player1.y - this.paddles.speed > 0) {
          this.paddles.player1.y -= this.paddles.speed;
        }
      } else if (player.side === 'players2') {
        if (this.paddles.player2.y - this.paddles.speed > 0) {
          this.paddles.player2.y -= this.paddles.speed;
        }
      }
    }
  }

  arrowDown(playerId: string) {
    const player = this.players.find((user) => user.id === playerId);
    if (player) {
      if (player.side === 'players1') {
        if (
          this.paddles.player1.y + this.paddles.height + this.paddles.speed <
          this.property.height
        ) {
          this.paddles.player1.y += this.paddles.speed;
        }
      } else if (player.side === 'players2') {
        if (
          this.paddles.player2.y + this.paddles.height + this.paddles.speed <
          this.property.height
        ) {
          this.paddles.player2.y += this.paddles.speed;
        }
      }
    }
  }

  updateCountdown() {
    if (this.property.countdown > 0) {
      this.property.countdown -= 1;
      if (this.property.countdown === 0 && this.property.statusGame) {
        // Le compte à rebours est terminé, vous pouvez ajouter ici le code à exécuter à la fin du timer.
        this.stopGameLoop();
      }
    }
  }
}
