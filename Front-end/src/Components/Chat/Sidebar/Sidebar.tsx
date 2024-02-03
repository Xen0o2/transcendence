import { Dispatch, SetStateAction } from "react"
import { color } from "../../../config";
import AddSettings from "./AddSettings/AddSettings";
import { FaUsers } from "react-icons/fa";
import { Channel, DMChannel } from "../Chat";
import Cookies from "js-cookie";
import Loader from "../../Loader/Loader";

export default function Sidebar(
    {showAddSettings, setShowAddSettings,
     selectedChat, setSelectedChat,
     channels, setChannels,
     DMChannels, setDMChannels,
     closeAllWindows, loadingChannels
    }: 
    {showAddSettings: boolean, setShowAddSettings: Dispatch<SetStateAction<boolean>>,
     selectedChat: string, setSelectedChat: Dispatch<SetStateAction<string>>,
     channels: Channel[], setChannels: Dispatch<SetStateAction<Channel[]>>,
     DMChannels: DMChannel[], setDMChannels: Dispatch<SetStateAction<DMChannel[]>>,
     closeAllWindows: () => void, loadingChannels: boolean
    }){


    const openAddSettings = () => {
        closeAllWindows()
        setShowAddSettings(!showAddSettings)
    }
    
    const changeChat = (chatId: string) => {
        setSelectedChat(chatId)
        closeAllWindows()
    }

    return (
        <div className="containerChannel" style={{ backgroundColor: color.primary }}>
            {showAddSettings && <AddSettings setSelectedChat={setSelectedChat} setChannels={setChannels} setDMChannels={setDMChannels} closeAllWindows={closeAllWindows} />}
            <div className="channel">
                {loadingChannels && <div className="containerLoaderSideBar"><Loader/></div>}
                {DMChannels.map((DMChannel: DMChannel, index) => (
                    <div className="containerCircleChat" key={index}>
                        <div className="circleChat" onClick={() => { changeChat(DMChannel.id); }}>
                            <img className="profilePicChannel" style={{ border: selectedChat === DMChannel.id ? "2px solid #C4C4C4" : "" }} src={DMChannel.user1.id === Cookies.get("id") ? DMChannel.user2.image : DMChannel.user1.image} alt="Utilisateur"/>
                        </div>
                    </div>
                ))}
                {channels.map((channel: Channel, index) => (
                    <div key={index} className="containerCircleChat">
                        <div  className="circleChat" style={{ border: selectedChat === channel.id ? "2px solid #C4C4C4" : "" }} onClick={() => { changeChat(channel.id); }}>
                            {channel.name.slice(0, 1)}
                            <FaUsers className="logoChannel" />
                        </div>
                    </div>
                ))}
                <div onClick={openAddSettings} id="addMsg">
                    <div className="circleChat">+</div>
                </div>
            </div>
        </div>
    )
}