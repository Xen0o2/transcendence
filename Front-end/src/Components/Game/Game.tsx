import "./Game.css";
import { useRef, useEffect, useState } from "react";

import { useSocket } from "../../ContextSocket";

import { color } from "../../config";
import Chat, { User } from "../Chat/Chat";
import pong from "../pong";
import SettingGame from "./SettingGame/SettingGame";
import Truck from "../Animations/Truck/Truck";

import { IoSettingsOutline } from "react-icons/io5";

export enum Page {
  DEFAULT_PAGE = 0,
  INVITE_A_FRIEND = 1,
  MATCHMAKING = 2,
  GAME_SCORE = 3,
  WAITING_FOR_FRIEND = 4,
  INVITATION_RECEIVED = 5
}

export default function Game() {

  const socket = useSocket();
  const pongCanvasRef = useRef<HTMLCanvasElement>(null);


  const [map, setMap] = useState(4);
  const [play, setPlay] = useState(false);
  const [score, setScore] = useState({ score1: 0, score2: 0 });
  const [imQuit, setImQuit] = useState(false);
  const [inviter, setInviter] = useState<User | null>(null);
  const [invited, setInvited] = useState<User | null>(null);
  const [players, setPlayers] = useState({ player1: "", player2: "" });
  const [leftGame, setLeftGame] = useState(false);
  const [pongGame, setPongGame] = useState<any>(null);
  const [showWindow, setShowWindow] = useState(true); // afficher setting
  const [pageSetting, setPageSetting] = useState<Page>(Page.DEFAULT_PAGE);
  const [canvasMesure, setCanvasMesure] = useState({ width: 0, height: 0 });
  const [showSettingPong, setShowSettingPong] = useState(false);

  const playGame = () => {
    if (socket){
      socket.emit('play', canvasMesure);
    }
   // setPlay(true);
  };

  const handleSettingPong = () => {
	if (!showWindow)
    	setShowSettingPong(!showSettingPong);
  };

  const quitGame = () => {
    if (socket){
      socket.emit('stop', 'stop');
    }
    if (pongGame) {
      pongGame.endGame();
    }
    setShowSettingPong(false);
    setShowWindow(true);
    setPlay(false);
    setImQuit(true);
  };

  useEffect(() => {
    const canvas = pongCanvasRef.current;
    const resizeCanvas = () => {
      if (canvas) {
        const parent = canvas.parentElement;
        if (parent) {
          setCanvasMesure({
            width : parent.clientWidth, height :parent.clientHeight
          })
        }
      }
    };
    resizeCanvas();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (socket) {
        socket.emit('stop', 'stop');
      }
    };
  }, [socket]);

  useEffect(() => {
    const canvas = pongCanvasRef.current;
    if (socket){

      const newPongGame = pong(canvas, socket);
      setPongGame(newPongGame);

      socket.on('partieLaunch', (message : string) => {
        setShowWindow(false);
        setPlay(true);
      })

      socket.on('stop', (message : string) => {
        setInvited(null);
        setInviter(null);
        setShowWindow(true);
        setLeftGame(true);
        setPlay(false);
        setMap(4);
		    setPageSetting(3);
      })

      socket.on('score', (message : any) => {
        setScore({
            score1: message.player1.score,
            score2: message.player2.score,
        })
        setPlayers({
            player1: message.player1.userName,
            player2: message.player2.userName,
        })
      })
    }
  },[socket, imQuit]);

  useEffect(() => {
    if (pongGame && play) {
      pongGame.start();
	  pongGame.selectMap(map);
    } 
  }, [pongGame, play, map]);

	useEffect(()=> {
		if (showWindow){
			setShowSettingPong(false);
		}
	},[showWindow])

  return (
    <div className="containerGame">
      <div className="containerGameChild">
      
        <div className="game" style={{ backgroundColor: color.primary }}>
        <IoSettingsOutline onClick={handleSettingPong} className="settingPong" />
       {showSettingPong && <div className="settingPongWindow">
			<p className="pSettingPong">Setting pong</p>
          <button onClick={quitGame} className="buttonQuitPong">Quit</button>
        </div>}
         { showWindow && <SettingGame pageSetting={pageSetting} setPageSetting={setPageSetting} invited={invited} setInvited={setInvited} inviter={inviter} setInviter={setInviter} setShowWindow={setShowWindow} playGame={playGame} socket={socket} leftGame={leftGame} score={score} setMap={setMap} players={players}/> }
          <canvas
            id="pong"
            ref={pongCanvasRef}
            height={850}
            width={1200}
            style = {{width: '100%', height: '100%', overflow: 'hidden'}} 
          ></canvas>
          { showWindow &&<Truck />}
        </div>
        <Chat pageSetting={pageSetting} setPageSetting={setPageSetting} invited={invited} setInvited={setInvited} inviter={inviter} setInviter={setInviter}/>
      </div>
    </div>
  );
}