import axios from "axios"
import Cookies from "js-cookie";
import { useEffect, useState } from "react"
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../../../App"
import { color } from "../../../config";
import { useNotification } from "../../../ContextNotification";
import { Channel } from "../../Chat/Chat"
import Loader from "../../Loader/Loader";
import ChannelComponent from "./ChannelComponent/ChannelComponent";
import "./Channels.css";

export default function Channels(){

    const showNotification = useNotification();

    const [channels, setChannels] = useState<Channel[]>([]);
    const [loading, setLoading] = useState(false)

    const [searchResult, setSearchResult] = useState<Channel[]>([])
    const [channelName, setChannelName] = useState("")
	const [typing, setTyping] = useState(false)

    

    useEffect(() => {
        const getChannels = async () => {
            setLoading(true)
            try {
                let response = await axios.get(`${API_BASE_URL}/channel/channels`)
                setChannels(response.data.filter((channel: Channel) => !channel.users.find(user => user.id === Cookies.get("id"))));
                setLoading(false)
            } catch(error) {
                setLoading(false)
                console.error(error)
                showNotification("ERROR_GETTING_CHANNELS", "An error occured while getting channels")
            }
        }

        getChannels()
    }, [])

    useEffect(() => {
		const searchChannels = async () => {
			setLoading(true)
			try {
				let response = await axios.get(`${API_BASE_URL}/channel/channels/${channelName}`)
				setSearchResult(response.data.filter((channel: Channel) => !channel.users.find(u => u.id === Cookies.get("id"))))
				setLoading(false)
			} catch(error) {
				setLoading(false)
				console.error(error)
                showNotification("ERROR_SEARCH_USERS", "An error occured while searching for users")
			}
		}

		let timeout: any;

		if (channelName !== ""){
			setTyping(true)
			setSearchResult([])
			timeout = setTimeout(async () => {
                searchChannels()
				setTyping(false)
			}, 1000);
		}

		return () => clearTimeout(timeout)
	}, [channelName])

    return (
        <div className="containerPublic">
            <div className="childPublic" style={{ backgroundColor: color.primary }}>
                <div className="containerTitle">
                    <div className="childContainerTitle">
                        <p>Public</p>
                    </div>
                </div>
                <div className="categoryPublic">
                    <Link to={`/public/players`} style={{ borderBottom: "none" }} className="pCategoryPublic">Players</Link>
					<Link to={`/public/channels`} style={{ borderBottom: "2px solid white" }} className="pCategoryPublic" >Channels</Link>
                </div>
                <div className="containerSearchBar">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="searchBarPublic"
                        onChange={(e) => {setChannelName(e.currentTarget.value)}}
                    />
                </div>
                <div style={{height: "90%", overflow: "auto"}}>
                    {!loading && channels.length === 0 && <div className="noChannels">No channel available</div>}
                    {!loading && !typing && channelName !== "" && searchResult.length === 0 && <div className="noPlayers">No channel found</div>}
                    {typing && !loading && <Loader />}
                    {loading ? 
                        <Loader /> :
                        (channelName !== "" ?
                            searchResult.map((channel, index) => (
                                <ChannelComponent channel={channel} setChannels={setChannels} key={index}/>                                
                            )) :
                            channels.map((channel, index) => (
                                <ChannelComponent channel={channel} setChannels={setChannels} key={index}/>
                            ))
                        )}
                </div>
            </div>
        </div>  
    )
}