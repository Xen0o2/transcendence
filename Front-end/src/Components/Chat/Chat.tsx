import "./Chat.css";
import { useEffect, useState, useRef, useCallback } from "react";
import { LuSettings2 } from "react-icons/lu";

import SettingUser from "./SettingUser/SettingUser";
import { GiSadCrab } from "react-icons/gi";
import ChatSettings from "./ChatSettings/ChatSettings";
import { color } from "../../config";
import axios from "axios";
import { API_BASE_URL } from "../../App";
import Sidebar from "./Sidebar/Sidebar";
import Cookies from "js-cookie";
import { useSocket } from "../../ContextSocket";
import MessageComponent from "./Message/MessageComponent";
import { useNotification } from "../../ContextNotification";

export interface Message {
  id: number;
  content: string;
  senderId: string;
  sender: User;
  channelId: number | null;
  channel: Channel | null;
  dmchannelId: number | null;
  dmchannel: DMChannel | null;
}

export interface User {
	id: string;
	login: string;
	firstname: string;
	lastname: string;
	image: string;
	friends: User[];
	friendship1: Friendship[] | undefined;
	friendship2: Friendship[] | undefined;
	dmchannel1: DMChannel[] | undefined;
	dmchannel2: DMChannel[] | undefined;
	blockedUsers: User[]
	blockedBy: User[];
	muted: Muted[];
	bannedFrom: Channel[];
	victory: number;
	defeat: number;
	level: number;
	matches1: Match[];
	matches2: Match[];
}

export interface Match {
	id: number;
	user1id: string;
	user1: User;
	user2id: string;
	user2: User;
	scoreUser1: number;
	scoreUser2: number;
	winnerid: string | null;
	winner: User | null;
	createdAt: string;
}

export interface Friendship {
	id: number;
	user1id: string;
	user1: User;
	user2id: string;
	user2: User;
	status: FriendshipStatus
}

export enum DMChannelStatus {
	OPEN = "OPEN",
	BLOCKED = "BLOCKED",
  	CLOSED = "CLOSED"
}
export enum FriendshipStatus {
	PENDING = "PENDING",
	ACCEPTED = "ACCEPTED"
}

export enum ChannelType {
	PUBLIC = "PUBLIC",
	PRIVATE = "PRIVATE"
}

export interface Channel {
	id: string;
  	type: ChannelType
	name: string;
	ownerId: string;
	owner: User | undefined;
  	password: string | null;
	admins: User[];
	users: User[];
	muted: Muted[];
	banned: User[];
	messages: Message[]
}

export interface Muted {
	id: number;
	userId: string;
	user: User;
	channelId: number;
	channel: Channel;
	createdAt: string;
}


export interface DMChannel {
	id: string;
	user1: User;
	user2: User;
	status: DMChannelStatus;
	blockerid: string | null;
	blockedBy: User | null;
	messages: Message[]
}

export default function Chat() {
	
	const socket = useSocket();
	const showNotification = useNotification();

	const [channels, setChannels] = useState<Channel[]>([])
	const [DMChannels, setDMChannels] = useState<DMChannel[]>([])
	
	const [typingDisable, setTypingDisable] = useState(0)

	const [loadingChannels, setLoadingChannels] = useState(false)

	const [showAddSettings, setShowAddSettings] = useState(false);
	const [selectedChat, setSelectedChat] = useState<string>("");
	const [showChatSettings, setShowChatSettings] = useState(false);
	const [showDMSettings, setShowDMSettings] = useState(false);

	const MaxText = 1000;
	
	const [maxChara, setMaxChara] = useState(false);
	const [message, setMessage] = useState("");
	const [tempMessage, setTempMessage] = useState("")

	const msgChatRef = useRef<HTMLDivElement>(null);

  	const typingDisableMessages = [
    	"Enter your msg ... (1000 characters max)",
		"Blocked user",
		"Can only send private messages to friends",
		"You're muted in this channel",
		"Select a channel first",
	]

  useEffect(() => {
    let dmchannel = DMChannels.find(dmchannel => dmchannel.id === selectedChat)
	let channel = channels.find(channel => channel.id === selectedChat)
    if (dmchannel && dmchannel.status === DMChannelStatus.BLOCKED) setTypingDisable(1)
    else if (dmchannel && dmchannel.status === DMChannelStatus.CLOSED) setTypingDisable(2)
	else if (channel && channel.muted.find(muted => muted.userId === Cookies.get("id"))) setTypingDisable(3)
	else if (selectedChat === "") setTypingDisable(4)
    else setTypingDisable(0)

	if (msgChatRef.current)
		msgChatRef.current.scrollTop = msgChatRef.current.scrollHeight;

	if (socket) {
		if (channel)
			socket.emit("switchedChannel", { channelId: selectedChat })
		else if (dmchannel)
			socket.emit("switchedDMChannel", { dmchannelId: selectedChat })
	}
  }, [selectedChat, DMChannels, channels, socket])

  //VOIR LE NOMBRE DE CARACTÈRES
  const handleTextAreaChange = (event: any) => {
    if (event.target.value.length <= MaxText) {
      setMaxChara(event.target.value.length === MaxText);
      setMessage(event.target.value);
    } else {
      setMaxChara(true);
    }
  };

  const closeAllWindows = () => {
      setShowAddSettings(false)
      setShowChatSettings(false);
      setShowDMSettings(false)
  };

	// ENVOIE LES MESSAGES DANS UN SALON
	const sendMessageToChannel = useCallback(() => {
	  	try {
			setTempMessage(message)
			if (socket) {
				socket.emit("sendChannelMessage", { channelId: selectedChat, userId: Cookies.get("id"), messageContent: message })
			}
		} catch(error) {
			console.error(error)
			showNotification("ERROR", "Une erreur est survenue")
		}
	}, [socket, selectedChat, message]);
	
	
	// ENVOIE LES MESSAGES DANS DES DM
	const sendMessageToUser = useCallback(() => {
		try {
			setTempMessage(message)
			if (socket) {
				socket.emit("sendDMChannelMessage", { dmchannelId: selectedChat, userId: Cookies.get("id"), messageContent: message })
			}
		} catch(error) {
			console.error(error)
			showNotification("ERROR", "Une erreur est survenue")
		}
	}, [socket, selectedChat, message]);
	
	// EVENEMENT DANS LE CHAT (MESSAGE, MODERATION, BLOCAGE)
	useEffect(() => {
		if (socket) {
			// LORS DE LA CONNEXION, SI DES GENS SONT DEJA ENTRAIN DE REGARDER DES SALONS
			if (DMChannels.find(dmchannel => dmchannel.id === selectedChat))
				socket.emit("switchedDMChannel", { dmchannelId: selectedChat })
			else if (channels.find(channel => channel.id === selectedChat))
				socket.emit("switchedChannel", { channelId: selectedChat })

			socket.on("messageReceiveInChannel", (data: {channel: Channel}) => {
				setTempMessage("")
				setChannels(oldChannels => {
					let editChannels = [...oldChannels]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("messageReceiveInDMChannel", (data: {dmchannel: DMChannel}) => {
				setTempMessage("")
				setDMChannels(oldDMChannels => {
					let editChannels = [...oldDMChannels]
					let index = editChannels.findIndex(channel => channel.id === data.dmchannel.id)
					if (index >= 0)
						editChannels[index] = data.dmchannel
					else
						editChannels.push(data.dmchannel)
					return editChannels;
				})
			})

			socket.on("hasBeenBlocked", (data: {dmchannel: DMChannel}) => {
				setMessage("")
				setDMChannels(oldDMChannels => {
					let editDMChannels = [...oldDMChannels]
					let index = editDMChannels.findIndex(dmchannel => dmchannel.id === data.dmchannel.id)
					editDMChannels[index] = data.dmchannel
					return editDMChannels;
				})
			})
			
			socket.on("hasBeenUnblocked", (data: {dmchannel: DMChannel}) => {
				setDMChannels(oldDMChannels => {
					let editDMChannels = [...oldDMChannels]
					let index = editDMChannels.findIndex(dmchannel => dmchannel.id === data.dmchannel.id)
					editDMChannels[index] = data.dmchannel
					return editDMChannels;
				})
			})

			socket.on("userHasBeenRemovedFromChannel", (data: { channel: Channel, userId: string }) => {
				if (Cookies.get("id") === data.userId) {
					setChannels(old => old.filter(channel => channel.id !== data.channel.id))
					if (selectedChat === data.channel.id)
						closeAllWindows()
				} else
					setChannels(old => {
						let editChannels = [...old]
						let index = editChannels.findIndex(channel => channel.id === data.channel.id)
						editChannels[index] = data.channel
						return editChannels;
					})
			})
			
			socket.on("adminHasBeenRemovedFromAdmins", (data: { channel: Channel, userId: string }) => {
				if (Cookies.get("id") === data.userId && selectedChat === data.channel.id)
					closeAllWindows()
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasBeenBannedFromChannel", (data: { channel: Channel, userId: string }) => {
				if (Cookies.get("id") === data.userId) {
					if (selectedChat === data.channel.id)
						closeAllWindows()
					setChannels(old => old.filter(channel => channel.id !== data.channel.id))
				} else
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasBeenUnbannedFromChannel", (data: { channel: Channel, userId: string }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasBeenMutedInChannel", (data: { channel: Channel, userId: string }) => {
				setMessage("")
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasBeenUnmutedInChannel", (data: { channel: Channel, userId: string }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("channelHasBeenDeleted", (data: { channel: Channel }) => {
				if (selectedChat === data.channel.id)
					closeAllWindows()
				setChannels(old => old.filter(channel => channel.id !== data.channel.id))
			})
			
			socket.on("ownerHasLeavedChannel", (data: { channel: Channel }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasLeavedChannel", (data: { channel: Channel }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("adminHasBeenAddedToChannel", (data: { channel: Channel }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})
			
			socket.on("userHasBeenAddedToChannel", (data: { channel: Channel, userId: string }) => {
				if (Cookies.get("id") === data.userId)
					setChannels(old => [...old, data.channel])
				else
					setChannels(old => {
						let editChannels = [...old]
						let index = editChannels.findIndex(channel => channel.id === data.channel.id)
						editChannels[index] = data.channel
						return editChannels;
					})
			})

			socket.on("channelPasswordHasChanged", (data: { channel: Channel }) => {
				setChannels(old => {
					let editChannels = [...old]
					let index = editChannels.findIndex(channel => channel.id === data.channel.id)
					editChannels[index] = data.channel
					return editChannels;
				})
			})

			socket.on("friendRequestAccepted", (data: { dmchannel: any }) => {
				setDMChannels(old => {
					let edit = [...old]
					let index = edit.findIndex(dmchannel => dmchannel.id === data.dmchannel.id)
					edit[index] = data.dmchannel
					return edit;
				})
			})

			socket.on("friendHasBeenRemoved", (data: { dmchannel: any }) => {
				setDMChannels(old => {
					let edit = [...old]
					let index = edit.findIndex(dmchannel => dmchannel.id === data.dmchannel.id)
					edit[index] = data.dmchannel
					return edit;
				})
			})
		}

 	// eslint-disable-next-line
  	}, [socket])

  // POST MESSAGE AVEC LA TOUCHE ENTRÉE
  	useEffect(() => {
    	const handleKeyPress = (event: any) => {
      		if (event.key === "Enter") {
        		event.preventDefault();
        		if (message && selectedChat !== "") {
					if (channels.find(channel => channel.id === selectedChat))
						sendMessageToChannel()
					else
						sendMessageToUser()
          			setMessage("");
        		}
      		}
		};
    	window.addEventListener("keydown", handleKeyPress);
    	return () => {
      		window.removeEventListener("keydown", handleKeyPress);
    	};
  	}, [message, channels, selectedChat, sendMessageToChannel, sendMessageToUser]);

  	const openChatSettings = () => {
      	closeAllWindows()
		setShowChatSettings(true)
    }
  	
	  const openDMSettings = () => {
      	closeAllWindows()
		setShowDMSettings(true)
    }

  	// RÉCUPÉRATION DE TOUS LES SALONS AU CHARGEMENT DE LA PAGE
	useEffect(() => {
		const getDMChannels = async () => {
			try {
				let response = await axios.get(`${API_BASE_URL}/dmChannel/dmChannels/${Cookies.get("id")}`)
				setDMChannels(response.data)
			} catch(error) {
				console.error(error)
				showNotification("ERROR", "Erreur réseau : Impossible de récupérer la liste des salons privés");
			}
		}

		const getChannels = async () => {
      		setLoadingChannels(true)
			try {
        		let response = await axios.get(`${API_BASE_URL}/channel/channels/withUser/${Cookies.get("id")}`)
				setChannels(response.data)
		        setLoadingChannels(false)
			} catch(error) {
        		setLoadingChannels(false)
				console.error(error)
				showNotification("ERROR", "Erreur réseau : Impossible de récupérer la liste des salons")
			}
		}

    	getDMChannels()
		getChannels()
	}, [])

	useEffect(() => {
		if (msgChatRef.current)
			msgChatRef.current.scrollTop = msgChatRef.current.scrollHeight;
	}, [channels, tempMessage])

  return (
    <div className="containerChat">
      <div className="chat">
      {/*APPARAIT QUAND CLIQUE SUR PARAMETRE DE GROUPE*/}
      {showChatSettings && ( <ChatSettings channels={channels} setChannels={setChannels} selectedChat={selectedChat} setSelectedChat={setSelectedChat} closeAllWindows={closeAllWindows} /> )}
      {/*APPARAIT QUAND CLIQUE SUR PARAMETRE DE DM*/}
    	{showDMSettings && <SettingUser DMChannelSettings={DMChannels.find(DMChannel => DMChannel.id === selectedChat)!} setDMChannels={setDMChannels} setTypingDisable={setTypingDisable} />}

        <div className="containerTopChat" style={{ backgroundColor: color.primary }}>
          <div className="nameConv">
            <p>{
            channels.find(channel => channel.id === selectedChat) ? channels.find(channel => channel.id === selectedChat)?.name :
              DMChannels.find(DMChannel => DMChannel.id === selectedChat) ? 
              (DMChannels.find(DMChannel => DMChannel.id === selectedChat)?.user1.id === Cookies.get("id") ? 
                DMChannels.find(DMChannel => DMChannel.id === selectedChat)?.user2.login :
                DMChannels.find(DMChannel => DMChannel.id === selectedChat)?.user1.login
              ) :
             "Choose a chat"}</p>
			{/*PARAMETRE DE GROUPE*/}
            {selectedChat !== "" && channels.find(channel => channel.id === selectedChat) && <LuSettings2 className="settingUser" onClick={openChatSettings} />}
			{/*PARAMETRE DE DM*/}
            {selectedChat !== "" && DMChannels.find(DMChannel => DMChannel.id === selectedChat) && <LuSettings2 className="settingUser" onClick={openDMSettings} />}

          </div>
		  {/*PAGE BLANCHE CHAT*/}
          <div onClick={closeAllWindows} className="msgChat" ref={msgChatRef}>

			{/*VOIR LES MESSAGES DU SALON QU'ON A CHOISIT*/}
            {selectedChat && channels.find(channel => channel.id === selectedChat) ?
				channels.find(channel => channel.id === selectedChat)!.messages.map((message, index) => {
					let messageBefore = channels.find(channel => channel.id === selectedChat)!.messages[index - 1]
					let displayLogin = (!messageBefore || messageBefore.senderId !== message.senderId)
					return <MessageComponent key={index} content={message.content} sender={message.sender} displayLogin={displayLogin}/>
				}) : null
			}
			{/*VOIR LES MESSAGES DU DM QU'ON A CHOISIT*/}
            {selectedChat && DMChannels.find(dmchannel => dmchannel.id === selectedChat) ?
				DMChannels.find(dmchannel => dmchannel.id === selectedChat)!.messages.map((message, index) => {
					let messageBefore = DMChannels.find(DMChannels => DMChannels.id === selectedChat)!.messages[index - 1]
					let displayLogin = (!messageBefore || messageBefore.senderId !== message.senderId)
					return <MessageComponent key={index} content={message.content} sender={message.sender} displayLogin={displayLogin}/>
				}) : null
			}

			{/*TEXTE SI PAS DE GROUPE CHOISI*/}
            {!selectedChat && (
              	<div className="ContainertextBeforeSelect">
            		<p className="textBeforeSelect">choose a person or group to chat with</p>
					<GiSadCrab className="crabIcon"/>
            	</div>
            )}

			{(tempMessage !== "" && selectedChat !== "") ?
				(channels.find(channel => channel.id === selectedChat) ?
					<MessageComponent content={tempMessage} sender={null} displayLogin={channels.find(channel => channel.id === selectedChat)!.messages[channels.find(channel => channel.id === selectedChat)!.messages.length - 1]?.senderId !== Cookies.get("id")}/> :
					
					(DMChannels.find(dmchannel => dmchannel.id === selectedChat) ?
						<MessageComponent content={tempMessage} sender={null} displayLogin={DMChannels.find(dmchannel => dmchannel.id === selectedChat)!.messages[DMChannels.find(dmchannel => dmchannel.id === selectedChat)!.messages.length - 1]?.senderId !== Cookies.get("id")}/> :
						null)) :
			 	null}
          </div>
        </div>
		{/*BACKGROUND TEXTAREA*/}
        <div className="containerBottomChat" style={{ backgroundColor: color.primary }}>
          <textarea value={message} onChange={handleTextAreaChange} placeholder={typingDisableMessages[typingDisable]} className="chatInput" style={{ backgroundColor: maxChara ? "red" : "" }} disabled={selectedChat === "" || !!typingDisable}></textarea>
		  <p className="numberOfCharacters">{message.length} / 1000</p>
        </div>
      </div>
	  <Sidebar 
	  	showAddSettings={showAddSettings} 
		setShowAddSettings={setShowAddSettings} 
		selectedChat={selectedChat} 
		setSelectedChat={setSelectedChat}
		channels={channels}
		setChannels={setChannels}
		DMChannels={DMChannels}
		setDMChannels={setDMChannels}
		closeAllWindows={closeAllWindows}
		loadingChannels={loadingChannels}
      />
    </div>
  );
}
