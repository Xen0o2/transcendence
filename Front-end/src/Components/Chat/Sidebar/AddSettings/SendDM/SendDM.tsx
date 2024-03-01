import axios from "axios"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { API_BASE_URL } from "../../../../../App"
import { DMChannel, User } from "../../../Chat"
import Cookies from "js-cookie"
import Loader from "../../../../Loader/Loader"
import { useNotification } from "../../../../../ContextNotification"

export default function SendDM({setSelectedChat, setDMChannels, closeAllWindows}: {setSelectedChat: Dispatch<SetStateAction<string>>, setDMChannels: Dispatch<SetStateAction<DMChannel[]>>, closeAllWindows: () => void}){

    let showNotification = useNotification();
    let [friends, setFriends] = useState<User[]>([])
    let [loading, setLoading] = useState(false)
    let [loadingSendDM, setLoadingSendDM] = useState<string[]>([])

    const sendDM = async (userId: string) => {
        setLoadingSendDM(old => [...old, userId])
        try {
            let response = await axios.put(`${API_BASE_URL}/dmchannel/create`, {
                prisma: {
                    user1id: Cookies.get("id"),
                    user2id: userId
                }
            })
            setDMChannels((oldDMChannels: DMChannel[]): any => {
                return [...oldDMChannels, response.data]
            })
            setSelectedChat(response.data.id)
            setLoadingSendDM(old => old.filter(id => id !== userId))
            closeAllWindows()
        } catch(error) {
            setLoadingSendDM(old => old.filter(id => id !== userId))
            console.error(error)
            showNotification("ERROR_LEAVING_CHANNEL", "An error occured while creating the channel");
        }
    }

    useEffect(() => {
        const getFriends = async () => {
            setLoading(true)
            try {
                let response = await axios.get(`${API_BASE_URL}/user/${Cookies.get("id")}`)
                console.log(response.data.friends.map((friend: User) => friend))
                setFriends(response.data.friends.filter((friend: User) => {
                    return !(friend.dmchannel1?.find(dmchannel => dmchannel.user1.id === Cookies.get("id") || dmchannel.user2.id === Cookies.get("id"))
                        || friend.dmchannel2?.find(dmchannel => dmchannel.user1.id === Cookies.get("id") || dmchannel.user2.id === Cookies.get("id")))
                }))
                setLoading(false)
            } catch(error) {
                setLoading(false)
                console.error(error)
                showNotification("ERROR_LEAVING_CHANNEL", "An error occured while getting friends list")
            }
        }

        getFriends()
    }, [])

    return (
        <div className="containerOptionSetting">
			<div className="containerSearchFriends">
                <div className="containerSendFriends">
                    {loading ? 
                        <Loader /> : 
                        friends.length ?
                            friends.map(friend => (
                                <div className="friendOptSetting">
                                    <p>{friend.login}</p>
                                    {loadingSendDM.includes(friend.id) ? 
                                        <button className="buttonSendMsg" disabled><Loader /></button> : 
                                        <button className="buttonSendMsg" onClick={() => {sendDM(friend.id)}}>Send</button>}
                                </div>
                            )) :
                            <p className="pSendDm">You have no friends to send a message to</p>
                    }
                </div>
			</div>
		</div>
    )
}