import "./SettingUser.css";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { color } from "../../../config";
import { DMChannel, DMChannelStatus } from "../Chat";
import axios from "axios";
import { API_BASE_URL } from "../../../App";
import Loader from "../../Loader/Loader";
import Cookies from "js-cookie";
import { Link } from "react-router-dom";
import { useSocket } from "../../../ContextSocket";
import { useNotification } from "../../../ContextNotification";

export default function SettingUser(
	{DMChannelSettings, setDMChannels, setTypingDisable}:
	{DMChannelSettings: DMChannel, setDMChannels: Dispatch<SetStateAction<DMChannel[]>>, setTypingDisable: Dispatch<SetStateAction<number>>}) {

	const showNotification = useNotification();
	const socket = useSocket()
	const [loading, setLoading] = useState(false)

	const handleBlock = async () => {
		if (DMChannelSettings.status === DMChannelStatus.OPEN) {
			setLoading(true)
			setTypingDisable(1)
			try {
				let response = await axios.post(`${API_BASE_URL}/dmChannel/block/${DMChannelSettings.id}/${Cookies.get("id")}`)
				if (socket)
					socket.emit("blockUser", { blockerId: Cookies.get("id"), blockedId: DMChannelSettings.user1.id == Cookies.get("id") ? DMChannelSettings.user2.id : DMChannelSettings.user1.id })
				setDMChannels(oldDMChannels => {
					let editDMChannels = [...oldDMChannels]
					let index = editDMChannels.findIndex(dmchannel => dmchannel.id === response.data.id)
					editDMChannels[index] = response.data
					return editDMChannels
				})
				setLoading(false)
			} catch(error) {
				setLoading(false)
				setTypingDisable(0)
				console.error(error)
				showNotification("ERROR_BLOCKING_USER", "An error occured while blocking a user")
			}
		} else {
			setLoading(true)
			try {
				let response = await axios.post(`${API_BASE_URL}/dmChannel/unblock/${DMChannelSettings.id}`)
				if (socket)
					socket.emit("unblockUser", { blockerId: Cookies.get("id"), blockedId: DMChannelSettings.user1.id == Cookies.get("id") ? DMChannelSettings.user2.id : DMChannelSettings.user1.id })
				setDMChannels(oldDMChannels => {
					let editDMChannels = [...oldDMChannels]
					let index = editDMChannels.findIndex(dmchannel => dmchannel.id === response.data.id)
					editDMChannels[index] = response.data
					return editDMChannels
				})
				setLoading(false)
				setTypingDisable(0)
			} catch(error) {
				setLoading(false)
				console.error(error)
				showNotification("ERROR_LEAVING_CHANNEL", "An error occured while unblocking a user")
			}
		}
	}

	return (
		<div
		className="containerSettingUser"
		style={{ backgroundColor: color.secondary }}
		>
		<p>Setting friends</p>
		<Link className="buttonProfile" to={`/profile/${DMChannelSettings.user1.id == Cookies.get("id") ? DMChannelSettings.user2.id : DMChannelSettings.user1.id}/profile`}>View profile</Link>
		<button className="buttonPlay">Invite to play</button>
		{DMChannelSettings.status === DMChannelStatus.OPEN ?
			<button style={{ backgroundColor: "#FF5A5A" }} onClick={handleBlock} className="buttonToBlock">{loading ? <Loader /> : "Block"}</button> :
			(DMChannelSettings.blockerid === Cookies.get("id") ?
				<button style={{ backgroundColor: "green" }} onClick={handleBlock} className="buttonToBlock">
					{loading ? <Loader /> : "Unblock"}
				</button> :
				<button className="buttonBlocked" style={{backgroundColor: "#FF5A5A"}} disabled>You've been blocked</button>)
		}
		
		</div>
	);
}
