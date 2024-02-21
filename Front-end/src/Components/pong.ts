import Map1 from '../assets/Map/tunsinge.png';
import Map2 from '../assets/Map/Rick.png';
import Map3 from '../assets/Map/Giga.png';

import Invisibility from '../assets/PowerUp/Invisible.png';
import Nerf from '../assets/PowerUp/Nerf.png';
import Random from '../assets/PowerUp/Random.png';
import Speed from '../assets/PowerUp/Speed.png';
import Teleport from '../assets/PowerUp/Teleport.png';
import { Socket } from 'socket.io-client';


export default function pong(id:any, socketID:any)
{
  
  const canvas = id;
  const ctx = canvas.getContext('2d')
  const ArrowColor = rgba(255, 255, 255, 1);
  const ScoreColor = rgba(0, 0, 0, 0.5);
  let   TimerColor = rgba(0, 0, 0, 0.5);
  let socket = socketID;
  let Timer : any  = 0;
  let side = ""
  let already = 0;
  

  // Assets //

  const background = new Image();  background.src = Map1;

  const PowerUp = new Image();
  PowerUp.src = Random;

  // size of canvas

  const PongWidth = canvas.width;
  const PongHeight = canvas.height;

  // score and time

  let PlayerScore1 = 0;
  let PlayerScore2 = 0;

  let TimeInM = 5;
  let TimeInS = 0;

  // Status of game

  let LastedTouch = 1;
  let EndGame = false;
  let GoalStatus = false;

  // Ball info

  let BallColor = 'White';
  let BallStroke = 'black';

  let BallRay = 10;

  let BallX = PongWidth / 2;
  let BallY = PongHeight / 2;

  let BallDirY = 0 * (PongHeight / 650);;
  let BallVelocity = 2.4;
  let BallDirX = 2 * (PongWidth / 720);
  

  // Paddle

  const HeightPaddle = 100;

  const PaddleColor = "white";
  const PaddleBorder = "black";

  // let Paddle1Speed = 10;
  // let Paddle2Speed = 10;

  let ShowMap = false;

  let Paddle1 = 
  {
      width: 15,
      height: HeightPaddle,
      x: 0,
      y: (PongHeight / 2) - 50
  }

  let Paddle2 = 
  {
      width: 15,
      height: HeightPaddle,
      x: PongWidth - 15,
      y: (PongHeight / 2) - 50
  }

  // bonus

  let BonusPos = {
    x: 0,
    y: 0,    ray: 40,
    x2: 0,
    y2: 0,
    BonusType: -1
  }

  let BonusOn = false;
  let BonusStatus = false;
  let BonusIsHere = false;
  let TeleportEffect = false;
  let InvisibleBall = false;
  let SpeedEffect = false;
  let RandomYEffect = false;

  // --------------------------------- //

  const keysState: { [key: string]: boolean } = {};

  window.addEventListener('keydown', (event: KeyboardEvent) =>
  {
      keysState[event.key] = true;
  });

  window.addEventListener('keyup', (event) => 
  {
      keysState[event.key] = false;
  });



  // --------------------------------- //

  function GameStart()
  {
      StartGame();
      BonusMode();
      Update()
      DrawElement();
  };

  function Update()
  {
    if (EndGame === false)
    {
        DrawElement();
        MovePaddle();
        //BallPhysics();
        requestAnimationFrame(Update);
    }
  };

  function ResetAll()
  {
    already = 0;
    BallX = PongWidth / 2;
    BallY = PongHeight / 2;
    BallDirX = 0;
    BallDirY = 0;
    TimeInM = 0;
    TimeInS = 0;
    EndGame = true;
  };

  // MAP //

  function DrawElement()
  {
    DrawPongZone();
    SpawnBonus();
    DrawScore(PlayerScore1, PlayerScore2);
    if (already < 180)
      DrawArrow()
    DrawTimer(TimeInM, TimeInS);
   // DrawBonusItem();
    DrawPongBall();
    DrawPaddle();
    if (GoalStatus === true)
    {
      GoalStatus = false;
    }
  };

  function DrawPongZone() 
  {
    ctx.clearRect(0, 0, PongWidth, PongHeight);

    if (ShowMap){
      ctx.drawImage(background, 0, 0, PongWidth, PongHeight);
    } 
  

    ctx.fillStyle = rgba(0, 0, 0, 0.2);

    ctx.beginPath();
    ctx.fillRect((PongWidth / 2) - 5, (PongHeight / 6), 10, PongHeight / 10);
    ctx.closePath();
  };

  function ChooseMap(choice: number)
  {
    ShowMap = true;
    if (choice === 0)
      background.src = Map1;
    else if (choice === 1)
      background.src = Map2;
    else if (choice === 2)
      background.src = Map3;
    else {
      ShowMap = false;
    }
    
  };

  function Goal(LastedTouch: number)
  {
    if (LastedTouch === 1)
      PlayerScore1 += 1;
    else
      PlayerScore2 += 1;
    ResetBonusStats(BonusPos.BonusType);
    ResetBallStats();
    GoalStatus = true;
  };

 

  // PADDLE //

  function MovePaddle()
  {
    if (keysState["ArrowLeft"])
    {
      // if (Paddle1.y - Paddle1Speed > 0)
      //   Paddle1.y -= Paddle1Speed;
    }
    else if (keysState["ArrowRight"])
    {
      // if (Paddle1.y + Paddle1Speed < PongHeight - Paddle1.height)
      //   Paddle1.y += Paddle1Speed;
    }

    if (keysState["ArrowUp"])
    {
      // if (Paddle2.y - Paddle2Speed > 0)
      //   Paddle2.y -= Paddle2Speed;
      socket.emit('ArrowUp', 'ArrowUp');
    }
    else if (keysState["ArrowDown"])
    {
      // if (Paddle2.y + Paddle2Speed < PongHeight - Paddle2.height)
      //   Paddle2.y += Paddle2Speed;
      socket.emit('ArrowDown', 'ArrowDown');
    }
  };

   // ---- Socket ---- //

  function DrawArrow() {
    already++;
    if (side == "left") {
      ctx.fillStyle = ArrowColor;
      ctx.font = "bold 70px Poppins";
      ctx.textAlign = "center";
      ctx.fillText("You", PongWidth / 4, PongHeight / 2);
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.height, canvas.width);
      }, 3000);
    }
    if (side == "right") {
      ctx.fillStyle = ArrowColor;
      ctx.font = "bold 70px Poppins";
      ctx.textAlign = "center";
      ctx.fillText("You", 3 * (PongWidth / 4), PongHeight / 2);
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.height, canvas.width);
      }, 3000);
    }
  }

   socket.on("drawLeft", () => {
      side = "left"
  })
  
  socket.on("drawRight", () => {
      side = "right"
   })

   socket.on('gameState', (message : any) => {
        Paddle1.y = message.paddles.player1.y;
        Paddle2.y = message.paddles.player2.y;

        //console.log(message);
        BallX = message.ball.x;
        BallY = message.ball.y;
        PlayerScore1 = message.paddles.player1.score;
        PlayerScore2 = message.paddles.player2.score;

        Timer = formatTime(Math.floor(message.property.countdown / 100)); 
   });

   const formatTime = (time:any) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };


   socket.on('stop', (message : string) => {

    ResetBallStats();
    ResetAll();
    DrawElement();
  })

   socket.on('ArrowDown', (message : any) => {
    Paddle1.y = message;
  });

   // ---- Socket ---- //
  function DrawPaddle() 
  {
    ctx.strokeStyle = PaddleBorder;
    ctx.fillStyle = PaddleColor;
    ctx.lineWidth = 2.5
    
    
    ctx.beginPath();
    ctx.fillRect(Paddle1.x, Paddle1.y, Paddle1.width, Paddle1.height);
    ctx.strokeRect(Paddle1.x, Paddle1.y, Paddle1.width, Paddle1.height);

    ctx.fillRect(Paddle2.x, Paddle2.y, Paddle2.width, Paddle2.height);
    ctx.strokeRect(Paddle2.x, Paddle2.y, Paddle2.width, Paddle2.height);
    ctx.closePath();
  };

  function DrawScore(Score1: number, Score2: number)
  {
    ctx.fillStyle = ScoreColor;
    ctx.font = "bold 70px Poppins";
    ctx.textAlign = "center";
    ctx.fillText(Score1, PongWidth / 4, PongHeight / 4);
    ctx.fillText(Score2, PongWidth - (PongWidth / 4), PongHeight / 4);
  };

  function DrawTimer(Min: number, Sec: number)
  {
    ctx.fillStyle = TimerColor;
    ctx.font = "bold 70px Poppins";
    ctx.textAlign = "center";
  

      ctx.fillText(Timer, (PongWidth / 2), PongHeight / 8);
  };

  // BALL //

  function DrawPongBall()
  {
      ctx.strokeStyle = BallStroke;
      ctx.fillStyle = BallColor;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.arc(BallX, BallY, BallRay, 0, Math.PI * 2, false);
      ctx.fill();
      ctx.stroke();
      ctx.closePath();
  };

  function ResetBonusStats(type: number)
  {
    BonusIsHere = false;
    TeleportEffect = false;
    BonusOn = false;
    if (type === 0)
    {
      BallColor = 'white';
      BallStroke = 'black';
      InvisibleBall = false;
    }
    else if (type === 1)
    {
      BallVelocity -= 1.8;
      SpeedEffect = false;
    }
    else if (type === 3)
    {
      Paddle1.height = HeightPaddle;
      Paddle2.height = HeightPaddle;
    }
    else if (type === 4)
    {
      RandomYEffect = false;
      BallDirX = 2.4;
    }
    // BonusPos.BonusType = -1;
  };

  function ResetBallStats()
  {
    if (BonusStatus === true)
    {
      ResetBonusStats(0);
      ResetBonusStats(1);
      ResetBonusStats(3);
      ResetBonusStats(4);
    }
      BallRay = 10;
      BallVelocity = 2.4;
      BallX = PongWidth / 2;
      BallY = PongHeight / 2;
      BallDirX = (2 * (PongWidth / 720)) * LastedTouch;
      BallDirY = 0;
      Paddle1.y = (PongHeight / 2) - 50;
      Paddle2.y = (PongHeight / 2) - 50;
  };

  // PHYSICS //

  // function BallPhysics()
  // {
  //   PaddleColision();
  //   WallColision();
  //   BonusCollision();

  //   BallX += (BallDirX * BallVelocity);
  //   BallY += BallDirY;
  // };

  function BallMovement(Paddle: any)
  {
    const ImpactY = (Paddle.y - BallY) * -1;
    
    if (ImpactY <= Paddle.height / 5)
    {
      BallDirX = 3;
      BallDirY = -3;
    }
    else if (ImpactY <= (Paddle.height / 5) * 2)
    {
      BallDirX = 3;
      BallDirY = -1;
    }
    else if (ImpactY <= (Paddle.height / 5) * 3)
    {
      BallDirX = 3;
      BallDirY = 0;
    }
    else if (ImpactY <= (Paddle.height / 5) * 4)
    {
      BallDirX = 3;
      BallDirY = 1;
    }
    else if (ImpactY <= Paddle.height)
    {
      BallDirX = 3;
      BallDirY = 3;
    }
  };

  function WallColision()
  {
    if (BallY - BallRay <= 0 || BallY + BallRay >= PongHeight)
      BallDirY *= -1;
    else if (BallX + BallRay >= PongWidth || BallX - BallRay <= 0)
      Goal(LastedTouch);
  };

  function PaddleColision()
  {
    let dx1 = Math.abs(BallX - Paddle1.x - Paddle1.width / 2);
    let dy1 = Math.abs(BallY - Paddle1.y - Paddle1.height / 2);

    let dx2 = Math.abs(BallX - Paddle2.x - Paddle2.width / 2);
    let dy2 = Math.abs(BallY - Paddle2.y - Paddle2.height / 2);


    if (dx1 <= (BallRay + Paddle1.width / 2) && dy1 <= ((Paddle1.height / 2) + BallRay))
    {
      BallMovement(Paddle1);
      // if (BallVelocity < 4)
      //   BallVelocity += 0.3;
      // LastedTouch = 1;
      // if (InvisibleBall === true || SpeedEffect === true)
      //   ResetBonusStats(BonusPos.BonusType);
    }
    else if (dx2 <= (BallRay + Paddle2.width / 2) && dy2 <= ((Paddle2.height / 2) + BallRay))
    {
      BallMovement(Paddle2);
       BallDirX *= -1;
      // if (BallVelocity < 4)
      //   BallVelocity += 0.3;
      // LastedTouch = -1;
      // if (InvisibleBall === true || SpeedEffect === true)
      //   ResetBonusStats(BonusPos.BonusType);
    }
  };

  // News

  function StartGame()
  {
    EndGame = false;
  };

  function BonusMode()
  {
    BonusStatus = true;
  };

  function SpawnBonus()
  {
    setTimeout(() => {
      if (BonusIsHere === false)
        BonusEvent();
    }, 15000)
  };

  function BonusEvent()
  {
    if (BonusStatus === false || BonusIsHere === true || BonusOn === true)
      return ;

    const randomBonus = getRandomInt(0, 4);

    if (randomBonus === 0)
    {
      PowerUp.src = Invisibility;
      BonusPos.BonusType = 0;
    }
    else if (randomBonus === 1)
    {
      PowerUp.src = Speed;
      BonusPos.BonusType = 1;
    }
    else if (randomBonus === 2)
    {
      BonusPos.BonusType = 2;
      TeleportEffect = true;
      PowerUp.src = Teleport;
    }
    else if (randomBonus === 3)
    {
      BonusPos.BonusType = 3;
      PowerUp.src = Nerf;
    }
    else if (randomBonus === 4)
    {
      BonusPos.BonusType = 4;
      PowerUp.src = Random;
    }
    AddPosBonus();
    BonusIsHere = true;
  }

  function AddPosBonus()
  {
    if (TeleportEffect === true)
    {
      BonusPos.x = getRandomInt(PongWidth / 8, (((PongWidth) / 2) - (PongWidth / 8)));
      BonusPos.x2 = getRandomInt((PongWidth / 2) + (PongWidth / 8), ((PongWidth) - (PongWidth / 8)));
      BonusPos.y = getRandomInt(PongHeight / 12, PongHeight - (PongHeight / 12));
      BonusPos.y2 = getRandomInt(PongHeight / 12, PongHeight - (PongHeight / 12));
      return ;
    }
    BonusPos.x = getRandomInt(PongWidth / 8, PongWidth - (PongWidth / 8));
    BonusPos.y = getRandomInt(PongHeight / 8, PongHeight - (PongHeight / 8));
  };

  function DrawBonusItem()
  {
    if (BonusIsHere === true)
    {
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.drawImage(PowerUp, BonusPos.x, BonusPos.y, BonusPos.ray, BonusPos.ray);
      ctx.closePath();

      if (TeleportEffect === true)
      {
        ctx.beginPath();
        ctx.drawImage(PowerUp, BonusPos.x2, BonusPos.y2, 40, 40);
        ctx.closePath();
      }
    }
  };

  function InvisibleBallBonus()
  {
    BonusOn = true;
    BallColor = rgba(0, 0 ,0 ,0);
    BallStroke = rgba(0, 0 ,0 ,0);
    InvisibleBall = true;
  };

  function RandomYBonus()
  {
    BallDirX = ((1.2 * (PongHeight / 720)) * LastedTouch);
    setTimeout(() => {
      if (RandomYEffect === true)
      {
        BallDirX = ((2.5 * (PongHeight / 720)) * LastedTouch);
        BallDirY = getRandomInt(-10, 10);
      }
    }, 500)
  };

  function SpeedBonus()
  {
    BallVelocity += 1.8;
    BonusOn = true;
    SpeedEffect = true;
  };

  function PaddleNerfBonus()
  {
    BonusOn = true;
    if (LastedTouch === 1)
    {
      Paddle2.height = HeightPaddle - (HeightPaddle / 4);
      Paddle1.height = HeightPaddle + HeightPaddle / 6;
    }
    else if (LastedTouch === -1)
    {
      Paddle1.height = HeightPaddle - (HeightPaddle / 4);
      Paddle2.height = HeightPaddle + HeightPaddle / 6;
    }

    setTimeout(() => {

      ResetBonusStats(BonusPos.BonusType);
    }, 5000)

  };

  function TeleportBonus()
  {
    if (BallX >= PongWidth / 2)
    {
      BallX = BonusPos.x;
      BallY = BonusPos.y;
    }
    else
    {
      BallX = BonusPos.x2;
      BallY = BonusPos.y2;
    }
    BallVelocity = 3;
    TeleportEffect = false;
    BonusPos.BonusType = -1;
  };

  function LaunchBonus()
  {
    if (BonusPos.BonusType === 0)
      InvisibleBallBonus();
    else if (BonusPos.BonusType === 1)
      SpeedBonus();
    else if (BonusPos.BonusType === 2)
      TeleportBonus();
    else if (BonusPos.BonusType === 3)
      PaddleNerfBonus();
      else if (BonusPos.BonusType === 4)
        RandomYBonus();
  };

  function BonusCollision()
  {
    if (BonusIsHere === false)
      return ;

    if ((BallY + BallRay >= BonusPos.y - BonusPos.ray && BallY - BallRay <= BonusPos.y + BonusPos.ray)
      && (BallX + BallRay >= BonusPos.x - BonusPos.ray && BallX - BallRay <= BonusPos.x + BonusPos.ray))
    {
      BonusIsHere = false;
      LaunchBonus();
    }
    else if (TeleportEffect && (BallY + BallRay >= BonusPos.y2 - BonusPos.ray && BallY - BallRay <= BonusPos.y2 + BonusPos.ray)
      && (BallX + BallRay >= BonusPos.x2 - BonusPos.ray && BallX - BallRay <= BonusPos.x2 + BonusPos.ray))
    {
      BonusIsHere = false;
      LaunchBonus();
    }
  };

  return {
    start: function()
    {
      GameStart();
      StartGame();
    },

    activeBonus: function()
    {
      BonusMode();
    },

    selectMap: function(choice: number)
    {
      ChooseMap(choice);
    },

    endGame: function()
    {
      ResetBallStats();
      ResetAll();
      DrawElement();
      
    }
  }
}

// DRAW //


// COLOR //

function rgba(r: number, g: number, b: number, a: number) 
{
  return `rgba(${r}, ${g}, ${b}, ${a})`
};

// RANDOM //

function getRandomInt(min: number, max: number) 
{
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
