import Map1 from '../assets/Map/tunsinge.png';
import Map2 from '../assets/Map/Rick.png';
import Map3 from '../assets/Map/Giga.png';

import Invisibility from '../assets/PowerUp/Invisible.png';
import Nerf from '../assets/PowerUp/Nerf.png';
import Random from '../assets/PowerUp/Random.png';
import Speed from '../assets/PowerUp/Speed.png';
import Teleport from '../assets/PowerUp/Teleport.png';


export default function pong(id:any, socketID:any)
{
  
  const canvas = id;
  const ctx = canvas.getContext('2d')
  const ScoreColor = rgba(0, 0, 0, 0.5);
  let   TimerColor = rgba(0, 0, 0, 0.5);
  let socket = socketID;
  let Timer : any  = 0;
  

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
    y: 0,
    ray: 40,
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
        requestAnimationFrame(Update);
    }
  };

  function ResetAll()
  {
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
    DrawTimer(TimeInM, TimeInS);
    DrawBonusItem();
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
    if (keysState["ArrowUp"])
    {
      socket.emit('ArrowUp', 'ArrowUp');
    }
    else if (keysState["ArrowDown"])
    {
      socket.emit('ArrowDown', 'ArrowDown');
    }
  };

   // ---- Socket ---- //

   socket.on('gameState', (message : any) => {
        Paddle1.y = message.paddles.player1.y;
        Paddle2.y = message.paddles.player2.y;

        BallX = message.ball.x;
        BallY = message.ball.y;
        BallColor = message.ball.ballColor;
        BallStroke = message.ball.ballStroke;
        PlayerScore1 = message.paddles.player1.score;
        PlayerScore2 = message.paddles.player2.score;

        BonusPos.BonusType = message.bonus.bonusType;
        BonusPos.x = message.bonus.x
        BonusPos.x2 = message.bonus.x2
        BonusPos.y = message.bonus.y
        BonusPos.y2 = message.bonus.y2
        BonusPos.ray = message.bonus.ray;
        BonusIsHere = message.bonus.bonusIsHere;
        
        BonusOn = message.bonus.BonusOn;
        BonusStatus = message.bonus.BonusStatus;
        BonusIsHere = message.bonus.BonusIsHere;
        TeleportEffect = message.bonus.TeleportEffect;
        InvisibleBall = message.bonus.InvisibleBall;
        SpeedEffect = message.bonus.SpeedEffect;
        RandomYEffect = message.bonus.RandomYEffect;

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

    BonusPos.BonusType = getRandomInt(0, 4);

    if (BonusPos.BonusType === 0)
    {
      PowerUp.src = Invisibility;
    }
    else if (BonusPos.BonusType === 1)
    {
      PowerUp.src = Speed;
    }
    else if (BonusPos.BonusType === 2)
    {
      TeleportEffect = true;
      PowerUp.src = Teleport;
    }
    else if (BonusPos.BonusType === 3)
    {
      PowerUp.src = Nerf;
    }
    else if (BonusPos.BonusType === 4)
    {
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