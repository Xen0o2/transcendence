import axios from "axios"
import Cookies from "js-cookie"
import { Dispatch, SetStateAction, useEffect, useState } from "react"
import { API_BASE_URL } from "../../../../App"
import { useNotification } from "../../../../ContextNotification"
import { useSocket } from "../../../../ContextSocket"
import { Channel } from "../../../Chat/Chat"
import Loader from "../../../Loader/Loader"

export default function ChannelComponent({channel, setChannels}: {channel: Channel, setChannels: Dispatch<SetStateAction<Channel[]>>}){

    const socket = useSocket();
    const showNotification = useNotification();
    const [password, setPassword] = useState("")
    const [loadingJoin, setLoadingJoin] = useState<string[]>([])

    const joinChannel = async (channel: Channel) => {
        if (channel.password && password === "") return
        setLoadingJoin(oldId => [...oldId, channel.id])
        try {
            let response = await axios.post(`${API_BASE_URL}/channel/${channel.id}/join/${Cookies.get("id")}${channel.password ? `/password` : ``}`, {
                password: password
            })

            if (response.data) {
                socket?.emit("addUserToChannel", { channel, userId: Cookies.get("id") })
                setChannels(oldChannels => [...oldChannels.filter(ch => ch.id !== channel.id)])
                showNotification("JOIN_CHANNEL", "Successfully joined channel \"" + response.data.name + "\"")
            } else
                showNotification("ERROR_INCORRECT_PASSWORD", "Incorrect password")

            setLoadingJoin(oldId => [...oldId.filter(id => id !== channel.id)])
        } catch(error) {
            setLoadingJoin(oldId => [...oldId.filter(id => id !== channel.id)])
            console.error(error)
            showNotification("ERROR_JOIN_CHANNEL", "An error occured while joining channel")
        }
    }

    useEffect(() => {
        socket?.on("userHasBeenAddedToChannel", (data: { channel: Channel, userId: string }) => {
            if (data.userId === Cookies.get("id")) {
                setChannels(old => old.filter(channel => channel.id !== data.channel.id))
                showNotification("PUBLIC_ADDED_TO_CHANNEL", "You've been added to channel \"" + data.channel.name + "\"")
            }
        })

        socket?.on("userHasBeenBannedFromChannel", (data: { channel: Channel, userId: string }) => {
            if (data.userId === Cookies.get("id")) {
                setChannels(old => {
                    let edit = [...old]
                    let index = edit.findIndex(channel => channel.id === data.channel.id)
                    if (index >= 0) {
                        edit[index] = data.channel
                        return edit;
                    } else
                        return [...old, data.channel]
                })
                showNotification("PUBLIC_BANNED_FROM_CHANNEL", "You've been banned from channel \"" + data.channel.name + "\"")
            }
        })
        
        socket?.on("userHasBeenUnbannedFromChannel", (data: { channel: Channel, userId: string }) => {
            if (data.userId === Cookies.get("id")) {
                setChannels(old => {
                    let edit = [...old]
                    let index = edit.findIndex(channel => channel.id === data.channel.id)
                    edit[index] = data.channel
                    return edit;
                })
                showNotification("PUBLIC_UNBANNED_FROM_CHANNEL", "You've been unbanned from channel \"" + data.channel.name + "\"")
            }
        })
        
        socket?.on("userHasBeenRemovedFromChannel", (data: { channel: Channel, userId: string }) => {
            if (data.userId === Cookies.get("id")) {
                setChannels(old => {
                    let edit = [...old]
                    let index = edit.findIndex(channel => channel.id === data.channel.id)
                    if (index >= 0) {
                        edit[index] = data.channel
                        return edit;
                    } else
                        return [...old, data.channel]
                })
                showNotification("PUBLIC_KICKED_FROM_CHANNEL", "You've been kicked from channel \"" + data.channel.name + "\"")
            }
        })

        socket?.on("channelPasswordHasChanged", (data: { channel: Channel }) => {
            setChannels(old => {
                let editChannels = [...old]
                let index = editChannels.findIndex(channel => channel.id === data.channel.id)
                editChannels[index] = data.channel
                return editChannels;
            })
        })

        socket?.on("channelHasBeenDeleted", (data: { channel: Channel }) => {
            setChannels(old => old.filter(channel => channel.id !== data.channel.id))
        })

    }, [socket])

    return (
        <div className="containerUserP">
            <div className="userPublic">
                <div className="containerLeftChannels">
                <img alt="imageUser" className="imgUserP" src={channel.owner?.image}></img>
                <div className="infoUserPChannel">
                    <div className="leftInfos">
                        <p>{channel.name}</p>
                        </div>
                        <div className="rightInfosChannel">
                            <p className="pChannel">{channel.users.length + " membre" + (channel.users.length > 1 ? "s" : "")}</p>
                        </div>
                </div>
                {channel.password ?
                    <input type="password" className="inputChannels" placeholder="password" onChange={(e)=>{setPassword(e.currentTarget.value)}}></input> :
                    <div className="inputChannels"></div>
                }
                </div>
                {loadingJoin.includes(channel.id) ?
                    <button className="buttonAccept" disabled><Loader /></button> :
                    (channel.banned.find(u => u.id === Cookies.get("id")) ? 
                        <button className="buttonBanned" disabled>Banned</button> :
                        <button className="buttonAccept" onClick={() => {joinChannel(channel)}} disabled={!!channel.password && password === ""}>Join</button>
                    )
                }
            </div>
        </div>
    )
}