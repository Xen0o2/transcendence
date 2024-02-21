import { Socket } from "socket.io";
import { PrismaService } from "src/prisma/prisma.service";
import { User, UserStatus } from "./user.class";

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
      countdown: 1000,
      intervalTimer: null,
      timeoutId: null,
      ballPause: false,
    }

    paddles = {
      speed : 10,
      width : 15,
      height : 100,
      player1: {
        x: 0,
        y: (this.property.height / 2) - 50,
        score: 0,
        userName: null,
      },
      player2: {
        x: this.property.width - 15,
        y: (this.property.height / 2) - 50,
        score: 0,
        userName: null,
      }
    };

    ball: any = {
      x: this.property.width / 2,
      y: this.property.height / 2,
      ballDirY: 0 * (this.property.height/ 650),
      ballVelocity: 4.4,
      ballDirX: 2 * (this.property.width / 720),
    }


    io:any;
    onStopCallback: ((arg: string) => void) | null = null;

    constructor(io: any, onStopCallback: ((arg:any) => void) | null = null, private readonly prisma: PrismaService, users: User[]){
      this.io = io;
      this.onStopCallback = onStopCallback;
      this.users = users;
    }

    startGameLoop(data:any) {
      this.property.statusGame = true;
      if (this.property.statusGame === true) {
        if (this.gameLoopInterval === null) {
          
          this.gameLoopInterval = setInterval(function() {
            this.updateGame();
            this.sendGameStateToClients();
          }.bind(this), 1000 / 60);
        }
    }
    };

    async stopGameLoop() {
      this.property.statusGame = true;

      if (this.players.length == 0) return
      for(let player of this.players)
        player.status = UserStatus.ONLINE
      for(let user of this.users)
        this.io.to(user.id).emit('usersStatus', this.users.map(user => {
          return {userId: user.ft_id, status: user.status};
        }));




      this.players.forEach(user => {
        // ENVOIE LE SCORE A TOUT LE MONDE
        this.io.to(user.id).emit('score', this.paddles);
      });

      if (this.gameLoopInterval !== null && this.players.length === 2){
        clearInterval(this.gameLoopInterval);
        this.gameLoopInterval = null;

        let match = await this.prisma.match.create({
          data: { 
            user1id: this.players[0].ft_id, 
            user2id: this.players[1].ft_id, 
            scoreUser1: this.paddles.player1.score, 
            scoreUser2: this.paddles.player2.score,
            winnerid: (this.paddles.player1.score == this.paddles.player2.score ?
        null :
        this.paddles.player1.score > this.paddles.player2.score ?
          this.players[0].ft_id :
          this.players[1].ft_id)
          }
        })
    
        const experienceToAdd = 100; // level * 1000 / 3 pour passer un niveau
        let user1 = await this.prisma.user.update({
        data: { 
          victory: { increment: Number(match.winnerid === this.players[0].ft_id) },
          defeat: { increment: Number(match.winnerid === this.players[1].ft_id) },
          experience: { increment: (Number(match.winnerid === this.players[0].ft_id) ? experienceToAdd * 2 : experienceToAdd / 2) }
        },
        where: { id: this.players[0].ft_id }
        })
        if (user1.experience >= user1.level * 1000 / 3)
          await this.prisma.user.update({
          data: { level: { increment: 1 }, experience: 0 },
          where: { id: user1.id }
        })
        let user2 = await this.prisma.user.update({
        data: { 
          victory: { increment: Number(match.winnerid === this.players[1].ft_id) },
          defeat: { increment: Number(match.winnerid === this.players[0].ft_id) },
          experience: { increment: (Number(match.winnerid === this.players[1].ft_id) ? experienceToAdd * 2 : experienceToAdd / 2) }
        },
        where: { id: this.players[1].ft_id }
        })
        if (user2.experience >= user2.level * 1000 / 3)
          await this.prisma.user.update({
          data: { level: { increment: 1 }, experience: 0 },
          where: { id: user2.id }
        })
        
        if (this.onStopCallback !== null) {
          this.onStopCallback("timer");
        }
      }
    }
    

    updateGame() {
      this.ballPhysics();
      this.updateCountdown();
    };

    sendGameStateToClients(){
      const gameState = {
        paddles: this.paddles,
        ball: this.ball, 
        property: this.property,
      };
      this.players.forEach(user => {
        this.io.to(user.id).emit('gameState', gameState);
      });
    }

    ballPhysics(){
      this.PaddleColision();
     // console.log("ballDIRX",this.ball.ballDirX);
      this.WallColision();
      // BonusCollision();
      if (!this.property.ballPause){
        this.ball.x += (this.ball.ballDirX * this.ball.ballVelocity);
        this.ball.y += this.ball.ballDirY;
      }
     
    }

    PaddleColision()
    {
      let dx1 = Math.abs(this.ball.x - this.paddles.player1.x - this.paddles.width / 2);
      let dy1 = Math.abs(this.ball.y - this.paddles.player1.y - this.paddles.height / 2);

      let dx2 = Math.abs(this.ball.x - this.paddles.player2.x - this.paddles.width / 2);
      let dy2 = Math.abs(this.ball.y - this.paddles.player2.y - this.paddles.height / 2);


      if (dx1 <= (this.property.ballRay + this.paddles.width / 2) && dy1 <= ((this.paddles.height / 2) + this.property.ballRay))
      {
         this.BallMovement(this.paddles.player1);
         this.property.lastedTouch = 1;
        // if (BallVelocity < 4)
        //   BallVelocity += 0.3;
        // if (InvisibleBall === true || SpeedEffect === true)
        //   ResetBonusStats(BonusPos.BonusType);
      }
      else if (dx2 <= (this.property.ballRay + this.paddles.width / 2) && dy2 <= ((this.paddles.height / 2) + this.property.ballRay))
      {
        this.BallMovement(this.paddles.player2);
        
    
         this.ball.ballDirX *= -1;
        
        // if (BallVelocity < 4)
        //   BallVelocity += 0.3;
        this.property.lastedTouch = -1;
        // if (InvisibleBall === true || SpeedEffect === true)
        //   ResetBonusStats(BonusPos.BonusType);
      }
    };

  BallMovement(Paddle: any)
  {
    
    const ImpactY = (Paddle.y - this.ball.y) * -1;
    
    if (ImpactY <= this.paddles.height / 5)
    {
      this.ball.ballDirX= 3;
      this.ball.ballDirY= -3;
    }
    else if (ImpactY <= (this.paddles.height / 5) * 2)
    {
      this.ball.ballDirX= 3;
      this.ball.ballDirY  = -1;
    }
    else if (ImpactY <= (this.paddles.height / 5) * 3)
    {
      this.ball.ballDirX = 3;
      this.ball.ballDirY  = 0;
    }
    else if (ImpactY <= (this.paddles.height / 5) * 4)
    {
      this.ball.ballDirX = 3;
      this.ball.ballDirY = 0;
    }
    else if (ImpactY <= this.paddles.height)
    {
      this.ball.ballDirX= 3;
      this.ball.ballDirY  = 3;
    }
  };

  resetBallStats(){
      this.ball.ballRay = 10;
      this.ball.ballVelocity = 4.4;
      this.ball.x = this.property.width / 2;
      this.ball.y = this.property.height / 2;
      this.ball.ballDirX = 2 * (this.property.width / 720) * this.property.lastedTouch;
      this.ball.ballDirY = 0 ;
      this.paddles.player1.y = (this.property.height / 2) - 50;
      this.paddles.player2.y = (this.property.height / 2) - 50;
  }

  setScore(){
    if (this.property.lastedTouch === 1){
      this.paddles.player1.score += 1;
    } else {
      this.paddles.player2.score += 1;
    }
  }

  WallColision() {
    if (this.ball.y - this.property.ballRay <= 0 || this.ball.y + this.property.ballRay >= this.property.height){
      this.ball.ballDirY *= -1;
    }
    else if (this.ball.x + this.property.ballRay >= this.property.width || this.ball.x - this.property.ballRay <= 0){
        this.resetBallStats();
        this.setScore();
        this.property.ballPause = true;
        setTimeout(() => {
          this.property.ballPause = false;
        },500); 
    }
  }
  
  arrowUp(playerId: string){
    const player = this.players.find(user => user.id === playerId);
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
  }}

  arrowDown(playerId: string){
    const player = this.players.find(user => user.id === playerId);
    if (player) {
      if (player.side === 'players1') {
        if ((this.paddles.player1.y + this.paddles.height)+ this.paddles.speed < this.property.height) {
          this.paddles.player1.y += this.paddles.speed;
        }
      } else if (player.side === 'players2') {
        if ((this.paddles.player2.y + this.paddles.height) + this.paddles.speed < this.property.height) {
          this.paddles.player2.y += this.paddles.speed;
        }
      }
  }}

  startGameTimer(){
    this.property.gameTimer = setInterval(() => {
      this.property.gameTime += 1;
    }, 1000)
  }

  stopGameTimer() {
    if (this.property.gameTimer !== null) {
      clearInterval(this.property.gameTimer);
      this.property.gameTimer = null;
      this.property.gameTime = 0;
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