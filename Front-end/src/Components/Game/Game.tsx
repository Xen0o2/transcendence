import "./Game.css";
import React, { useRef, useEffect, useState} from "react";

import { useSocket } from "../../ContextSocket";

import { color } from "../../config";
import Chat from "../Chat/Chat";
import pong from "../pong";
import SettingGame from "./SettingGame/SettingGame";
import Truck from "../Animations/Truck/Truck";

import { IoSettingsOutline } from "react-icons/io5";

export default function Game() {

  const pongCanvasRef = useRef<HTMLCanvasElement>(null);
  const [pongGame, setPongGame] = useState<any>(null);
  const [showWindow, setShowWindow] = useState(true); // afficher setting
  const socket = useSocket();
  const [canvasMesure, setCanvasMesure] = useState({ width: 0, height: 0 });
  const [showSettingPong, setShowSettingPong] = useState(false);
  const [play, setPlay] = useState(false);
  const [leftGame, setLeftGame] = useState(false);
  const [imQuit, setImQuit] = useState(false);
  const [score, setScore] = useState({
    score1:0,
    score2:0,
})
  const [page, setPage] = useState(0);
  const [map, setMap] = useState(4);
  const [players, setPlayers] = useState<any>({
    player1: "",
    player2: ""
  })

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
        setShowWindow(true);
        setLeftGame(true);
        setPlay(false);
        setMap(4);
		setPage(3);
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
         { showWindow && <SettingGame setShowWindow={setShowWindow} playGame={playGame} socket={socket} leftGame={leftGame} score={score} page={page} setMap={setMap} players={players}/> }
          <canvas
            id="pong"
            ref={pongCanvasRef}
            height={850}
            width={1200}
            style = {{width: '100%', height: '100%', overflow: 'hidden'}} 
          ></canvas>
          { showWindow &&<Truck />}
        </div>
        <Chat />
      </div>
    </div>
  );
}