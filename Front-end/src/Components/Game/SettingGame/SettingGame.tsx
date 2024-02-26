import React, {Dispatch, SetStateAction, useEffect, useState} from 'react';
import "./SettingGame.css"
import { GrReturn } from "react-icons/gr";
import { User } from '../../Chat/Chat';
import axios from 'axios';
import { API_BASE_URL } from '../../../App';
import { Page } from '../Game';
import Cookies from 'js-cookie';
import { useNotification } from '../../../ContextNotification';
import Loader from '../../Loader/Loader';


interface SettingGameProps {
    pageSetting   : Page;
    setPageSetting: Dispatch<SetStateAction<Page>>;
    invited       : User | null;
    setInvited    : Dispatch<SetStateAction<User | null>>;
    inviter       : User | null;
    setInviter    : Dispatch<SetStateAction<User | null>>;
    setShowWindow : React.Dispatch<React.SetStateAction<boolean>>;
    playGame()    : void;
    socket        : any;
    leftGame      : boolean;
    score         : any;
    setMap        : Dispatch<SetStateAction<number>>;
    players       : any;
}

export default function SettingGame({pageSetting, setPageSetting, invited, setInvited, inviter, setInviter, setShowWindow, playGame, socket, leftGame, score, setMap, players}: SettingGameProps ){

    const showNotification = useNotification();

    const [usersStatus, setUsersStatus] = useState<{userId: string, status: number}[]>([])
    const [friends, setFriends] = useState<User[]>([])
    const [loadingFriends, setLoadingFriends] = useState(false);

    const [userArrived, setUserArrived] = useState(false);
    const [userInGame, setUserInGame] = useState<any>([]);
    const [mapSelect, setMapSelect] = useState(4);
    const [timeBeforePlay, setTimeBeforePlay] = useState<any>(null);
    const [bonus, setBonus] = useState(1);
    const [timerStart, setTimerStart] = useState(false);
   

// fonction pour lancer la partie de Pong (qui sert surement a rien pour l'instant)

    const handlePlay = () => {
        //setShowWindow(false);
        setInvited(null);
        setInviter(null);
        setTimerStart(true);
        playGame();
    };

// fonctions pour changer de page dans les settings

    const getOnlineFriends = () => {
        setPageSetting(Page.INVITE_A_FRIEND);
        socket?.emit("getUsersStatus")
    }

    const joinMatchmaking = () => {
        setPageSetting(Page.MATCHMAKING);
        socket?.emit("matchmaking", "matchmaking")
    }


// fonction pour retourner sur la première page de settings

    const handleReturn = (infos:string) => {
        setPageSetting(Page.DEFAULT_PAGE);
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

    const getFriends = async () => {
        setLoadingFriends(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/user/${Cookies.get("id")}/friends`)
            setFriends(response.data.filter((user: User) => usersStatus.find(e => e.userId === user.id)))
            setLoadingFriends(false);
        } catch(error) {
            setLoadingFriends(false);
            console.error(error);
            showNotification("ERROR_GET_FRIENDS", "An error occured while getting friends list")
        }
    }

    const inviteFriend = async (friend: User) => {
        socket?.emit("gameInvitationSent", { inviterId: Cookies.get("id"), invitedId: friend.id })
        setInvited(friend);
        setPageSetting(Page.WAITING_FOR_FRIEND)
    }

    const cancelInvitation = async () => {
        socket?.emit("gameInvitationCancel", { inviterId: Cookies.get("id"), invitedId: invited!.id })
        setInvited(null);
        setPageSetting(Page.DEFAULT_PAGE);
        showNotification("CANCEL_INVITATION", "Successfully cancel game invitation")
    }

    const acceptInvitation = async () => {
        socket?.emit("gameInvitationAccept", { inviterId: inviter!.id, invitedId: Cookies.get("id") });
    }
    
    const declineInvitation = async () => {
        socket?.emit("gameInvitationDecline", { inviterId: inviter!.id, invitedId: Cookies.get("id") });
        setInviter(null);
        setPageSetting(Page.DEFAULT_PAGE);
    }

    useEffect(() => {
        if (socket){
            socket.emit("getGameInvitation", { userId: Cookies.get("id")});

            socket.on("gameInvitationList", (invitation: { inviter: User, invited: User }) => {
                if (Cookies.get("id") === invitation.inviter.id) {
                    setInvited(invitation.invited);
                    setPageSetting(Page.WAITING_FOR_FRIEND);
                }
                if (Cookies.get("id") === invitation.invited.id) {
                    setInviter(invitation.inviter);
                    setPageSetting(Page.INVITATION_RECEIVED);
                }
            })

            socket.on('playerJoined', (message : string) => {
                console.log(message);
            });
            socket.on('userList', (message : string) => {
                setPageSetting(Page.MATCHMAKING)
                setUserArrived(true);
                setUserInGame(message);
                console.log(message);
            })
            socket.on('returnToMenu', (message : string) => {
                showNotification("USER_LEFT", "A user has leaved the game")
                setUserArrived(false);
                setTimeBeforePlay(null);
                setPageSetting(Page.DEFAULT_PAGE)
            })
            socket.on('timeBeforePlay', (message: number) => {
                setTimerStart(true);
                setTimeBeforePlay(message);
            });
            socket.on('bonus', (bonusValue: number) => {
                setBonus(bonusValue)
            });
            socket.on("usersStatus", (users: {userId: string, status: number}[]) => {
                setUsersStatus(users);
                setTimerStart(false);
            })
            socket.on("userAlreadyInvited", () => {
                setPageSetting(Page.INVITE_A_FRIEND)
                setInvited(null);
                showNotification("ERROR_ALREADY_INVITED", "This player has already been invited by another player")
            })
            socket.on("userAlreadyInviter", () => {
                setPageSetting(Page.DEFAULT_PAGE)
                setInvited(null);
                showNotification("ERROR_ALREADY_INVITED", "This player already invites another player")
            })
            socket.on("gameInvitationReceived", (inviter: User) => {
                setPageSetting(Page.INVITATION_RECEIVED);
                setInviter(inviter);
                showNotification("INVITATION_RECEIVED", `${inviter.login} wants to play with you`)
            })
            socket.on("gameInvitationCancelled", () => {
                setPageSetting(Page.DEFAULT_PAGE);
                setInviter(null);
                showNotification("ERROR_INVITATION_CANCELLED", "Game invitation has been cancelled")
            })
            socket.on("gameInvitationDeclined", () => {
                setPageSetting(Page.DEFAULT_PAGE);
                setInvited(null);
                showNotification("ERROR_INVITATION_DECLINED", "Game invitation has been declined")
            })
            socket.on("userInvitedIsOffline", () => {
                setPageSetting(Page.DEFAULT_PAGE);
                setInvited(null);
                showNotification("ERROR_PLAYER_OFFLINE", "This player is offline")
            })
        }
        // eslint-disable-next-line
    }, [socket])

    const handleSetBonus = (value: number) => {
        setBonus(value);
        socket?.emit("Bonus", value);
    };

    useEffect(() => {
        getFriends();
        if (inviter && !usersStatus.find(user => user.userId === inviter.id)) {
            setPageSetting(Page.DEFAULT_PAGE);
            showNotification("ERROR_INVITER_DISCONNECT", `${inviter.login} just disconnect`)
            setInviter(null);
        }
        if (invited && !usersStatus.find(user => user.userId === invited.id)) {
            setPageSetting(Page.DEFAULT_PAGE);
            showNotification("ERROR_INVITED_DISCONNECT", `${invited.login} just disconnect`)
            setInvited(null);
        }
        // eslint-disable-next-line
    }, [usersStatus])
    

    return (
    <>
        {pageSetting  === 0 && (
        <div className='containerSettingGame'>
          
                <p className='pSettingGame'>If you want to play the best Pong game ever created in the world, click below.</p>
                {<>
                <button  onClick={getOnlineFriends} className='ButtonSettingGame' >
                    Invite a friend
                </button>
                <button onClick={joinMatchmaking} className='ButtonSettingGame' >
                    Matchmaking
                </button> 
                </>}
              
        </div>)}

        {pageSetting  === 1 && (
        <div className='containerSettingGame'>
            <GrReturn className='returnSettingGame' onClick={()=>{handleReturn("friend")}}/>
            <p className='pSettingGame2'>Invite a friend</p>
            <div className='containerFriendSettingGame'>
            {loadingFriends && <Loader />}
            {!loadingFriends && friends.length === 0 && <p className='noFriendAvailable'>Nobody is available</p>}
            {!loadingFriends && friends.length !== 0 &&
                friends.map((friend, index) => (
                    <div className='FriendSettingGame' key={index}>
                        <img className="friendProfilePic" src={friend.image} alt="profile pic"></img>
                        <p>{friend.login}</p>
                        <button className='buttonFriendSettingGame' onClick={() => inviteFriend(friend)}>Invite</button>
                    </div>
                ))
            }
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
                            <img alt="Img" className="imgUserGame" src={user.image}></img>
                            <p>{user.login}</p>
                            <p>Level {user.level}</p>
                        </div>    
                    ))}
                     <button onClick={handlePlay} className='buttonStartGame' disabled={timerStart}>
                            {timeBeforePlay || 'Play'}
                    </button>
                    <div className='chooseMap'>
                        <button onClick={()=>{handleChooseMap(4)}} className='buttonMap' style={{backgroundColor: (mapSelect === 4) ? "green" : "#4A4A4A"}}>
                            Map 1
                        </button>
                        <button  onClick={()=>{handleChooseMap(0)}} className='buttonMap' style={{backgroundColor: (mapSelect === 0) ? "green" : "#4A4A4A"}}>
                            Map 2
                        </button>
                        <button onClick={()=>{handleChooseMap(1)}} className='buttonMap' style={{backgroundColor: (mapSelect === 1) ? "green" : "#4A4A4A"}}>
                            Map 3
                        </button>
                        <button  onClick={()=>{handleChooseMap(2)}} className='buttonMap' style={{backgroundColor: (mapSelect === 2) ? "green" : "#4A4A4A"}}>
                            Map 4
                        </button>
                    </div>
                    <div className='chooseBonus'>
                    <div className='containerRemovePassword' style={{height:"80%"}}>
                            <div onClick={() => {handleSetBonus(0)}} style={{backgroundColor: bonus === 0 ? "green" : "#4A4A4A"}} className='gameBonus'>Small</div>
                            <div onClick={() => {handleSetBonus(1)}} style={{backgroundColor: bonus === 1 ? "green" : "#4A4A4A"}} className='gameBonus'>Normal</div>
                            <div onClick={() => {handleSetBonus(2)}} style={{backgroundColor: bonus === 2 ? "green" : "#4A4A4A"}} className='gameBonus'>Long</div>
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
                <button onClick={()=>{handleReturn("replay")}} className='buttonStartGame'>Replay</button> 
         </div>}
        
        {pageSetting === 4 && invited !== null &&
         <div className='containerSettingGame'>
            <p className='pSettingGame2'>Invitation sent</p>
            <div className='containerMatchmakingSettingGame'>
                <p>Waiting for {invited.login}...</p>
                <div className='loader_container'>
                    <div className='loader2'></div>
                </div>
            </div>
            <button className='invitationCancel' onClick={cancelInvitation}>Cancel</button>
        </div>}
        
        {pageSetting === 5 && inviter !== null &&
         <div className='containerSettingInvitationReceive'>
                <img src={inviter.image} className='inviterProfilePic' alt="profile pic of inviter"/>
                <p className='inviterUsername'>{inviter.login}</p>
                <p className='invitationDescription'>Wants to play with you</p>
                <div className='invitationButtons'>
                    <button onClick={acceptInvitation} className='invitationButtonAccept'>Accept</button> 
                    <button onClick={declineInvitation} className='invitationButtonDecline'>Decline</button> 
                </div>
         </div>}
        </>
    )
}