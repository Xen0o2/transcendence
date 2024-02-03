import React, {useEffect, useState} from 'react';
import "./SettingGame.css"
import { GrReturn } from "react-icons/gr";
import image from '../../../assets/alecoutr.jpg'


interface SettingGameProps {
    setShowWindow: React.Dispatch<React.SetStateAction<boolean>>;
    playGame():void;
    socket: any;
    leftGame: boolean;
    score:any;
    page:number;
    setMap:any;
    players:any;
  }
  

export default function SettingGame({setShowWindow, playGame, socket, leftGame, score, page, setMap, players} : SettingGameProps ){

    const [pageSetting, setPageSetting] = useState<number>(page); // a changer
    const [userArrived, setUserArrived] = useState(false);
    const [userInGame, setUserInGame] = useState<any>([]);
    const [mapSelect, setMapSelect] = useState(4);
    const [timeBeforePlay, setTimeBeforePlay] = useState<any>(null);
    const [bonus, setBonus] = useState(false);
   

// fonction pour lancer la partie de Pong (qui sert surement a rien pour l'instant)

    const handlePlay = () => {
        //setShowWindow(false);
        playGame();
    };

// fonction pour changer de page dans les settings

    const handlePageSetting = (value : number) => {

        setPageSetting(value);

        if (value === 2){
            socket?.emit("matchmaking", "matchmaking");
        }
    };

// fonction pour retourner sur la première page de settings

    const handleReturn = (infos:string) => {
        setPageSetting(0);
        setTimeBeforePlay(null);
        if (infos === "matchmaking"){
            socket?.emit("leftMatchmaking", "matchmaking");
        }
    };

// fonction pour changer la map

    const handleChooseMap = (value:number) => {
        setMap(value);
        setMapSelect(value);
    };


    useEffect(() => {
        if (socket){
            socket.on('playerJoined', (message : string) => {
                console.log(message);
            });
            socket.on('userList', (message : string) => {
                setUserArrived(true);
                setUserInGame(message);
            })
            socket.on('returnToMenu', (message : string) => {
                setUserArrived(false);
                setTimeBeforePlay(null);
            })
            socket.on('timeBeforePlay', (message: number) => {
                setTimeBeforePlay(message);
            });
            socket.on('bonus', (message: boolean) => {
                if (message === true)
                    setBonus(true);
                else if (message === false)
                    setBonus(false);
            });
        }
    }, [socket])

    useEffect(() => {
       setPageSetting(page);
    },[page])

    const handleSetBonus = (value:boolean) => {
        if (value){
            setBonus(true);
            socket?.emit("Bonus", true);
        } else {
            setBonus(false);
            socket?.emit("Bonus", false);
        }
    };
 
    

    return (
    <>
        {pageSetting  === 0 && (
        <div className='containerSettingGame'>
          
                <p className='pSettingGame'>If you want to play the best Pong game ever created in the world, click below.</p>
                {<>
                <button  onClick={()=>{handlePageSetting(1)}} className='ButtonSettingGame' >
                Invite a friend
                </button>
                <button onClick={()=>{handlePageSetting(2)}} className='ButtonSettingGame' >
                    Matchmaking
                </button> 
                </>}
              
        </div>)}

        {pageSetting  === 1 && (
        <div className='containerSettingGame'>
            <GrReturn className='returnSettingGame' onClick={()=>{handleReturn("friend")}}/>
          <p className='pSettingGame2'>
            Invite a friend
          </p>
               <div className='containerFriendSettingGame'>
                    <div className='FriendSettingGame'>
                        <p>Name</p>
                        <button className='buttonFriendSettingGame'>
                            Invite
                        </button>
                    </div>
               </div> 
        </div>)}

        {pageSetting  === 2 && (
        <div className='containerSettingGame'>
            <GrReturn className='returnSettingGame' onClick={()=>{handleReturn("matchmaking")}}/>
            <p className='pSettingGame2'>
                Matchmaking   
            </p>
               {!userArrived && <div className='containerMatchmakingSettingGame'>
                <p>We choose your opponent.</p>
                    <div className='loader_container'>
                        <div className='loader2'>
                        </div>
                    </div>
               </div>}
               {userArrived &&
                <div className='containerMatchmakingSettingGame'>
                    {userInGame.map((user: any) => (
                        <div key={user.id} className='userInGame'>
                            <img alt="Img" className="imgUserGame" src={image}></img>
                            <p>{user.username}</p>
                            <p>Level</p>
                        </div>    
                    ))}
                     <button onClick={handlePlay} className='buttonPlay'>
                             {timeBeforePlay ?  timeBeforePlay : 'Play'}
                    </button>
                    <div className='chooseMap'>
                        <button onClick={()=>{handleChooseMap(4)}} className='buttonMap' style={{border: (mapSelect === 4) ? "5px solid #b8b8b8" : ""}}>
                                Map 1
                        </button>
                        <button  onClick={()=>{handleChooseMap(0)}} className='buttonMap' style={{border: (mapSelect === 0) ? "5px solid #b8b8b8" : ""}}>
                                Map 2
                        </button>
                        <button onClick={()=>{handleChooseMap(1)}} className='buttonMap' style={{border: (mapSelect === 1) ? "5px solid #b8b8b8" : ""}}>
                                Map 3
                        </button>
                        <button  onClick={()=>{handleChooseMap(2)}} className='buttonMap' style={{border: (mapSelect === 2) ? "5px solid #b8b8b8" : ""}}>
                                Map 4
                        </button>
                    </div>
                    <div className='chooseBonus'>
                    <div className='containerRemovePassword' style={{height:"80%"}}>
                            <div onClick={() => {handleSetBonus(false)}} style={{backgroundColor: !bonus ? "#FF5A5A" : "#4A4A4A"}} className='removePassword'>no bonus</div>
                            <div onClick={() => {handleSetBonus(true)}} style={{backgroundColor: bonus ? "green" : "#4A4A4A"}} className='removePassword'>bonus</div>
                        </div>
                    </div>
                    
                </div>
               }
                
        </div>)}
        {pageSetting === 3 &&
         <div className='containerSettingGame'>
                <p className='pSettingGame'>Your score is </p>
                <div className='score'>
                    <p className='pNameScore'> {players.player1}  </p>
                    <p className='pScore'>{score?.score1}</p>
                    <p className='pScore'>-</p>
                    <p className='pScore'> {score?.score2} </p>
                    <p className='pNameScore'> {players.player2}  </p>
                </div>
                <button onClick={()=>{handleReturn("replay")}} className='buttonPlay'>
                            Replay
                </button>
                
         </div>
        }
        </>
    )
}