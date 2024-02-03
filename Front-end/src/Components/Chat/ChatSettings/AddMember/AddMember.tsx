import "./AddMember.css";
import { Dispatch, SetStateAction, useState } from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import axios from "axios";
import { API_BASE_URL } from "../../../../App";
import Cookies from "js-cookie";
import { Channel, User } from "../../Chat";
import Loader from "../../../Loader/Loader";
import { useSocket } from "../../../../ContextSocket";
import { useNotification } from "../../../../ContextNotification";

export default function AddMember(
	{setChannels, selectedChat, users}: 
	{setChannels: Dispatch<SetStateAction<Channel[]>>, selectedChat: string, users: User[] }) {

	const showNotification = useNotification();
	const socket = useSocket();
	const [loading, setLoading] = useState<string[]>([])

	const user = users.find((user: User) => user.id === Cookies.get("id"));
	if (!user)
		showNotification("ERROR_GET_USER", "An error occured while loading")

	const addUserToGroup = async (userId: string) => {
		setLoading(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/addUser/${userId}`)

			socket?.emit("addUserToChannel", { channel: response.data, userId })

			setChannels(oldChannels => {
				let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
			setLoading(old => old.filter(id => id !== userId))
		} catch(error) {
			setLoading(old => old.filter(id => id !== userId))
			console.error(error)
			showNotification("ERROR_ADD_USER_CHANNEL", "An error occured while adding a user in the channel")
		}
	}

  return (
    <div className="containerSettingGroupChild">
      <p>Add Member</p>
      <div className="scrollAddAdmin">
		{user?.friends.filter((user: User) => !users.find(u => u.id === user.id) && !user.bannedFrom.find(chan => chan.id === selectedChat)).length === 0 && <center>Nobody to add</center>}
		{user?.friends.filter((user: User) => !users.find(u => u.id === user.id) && !user.bannedFrom.find(chan => chan.id === selectedChat)).map((user: User, index: number) => (
			<div className="memberGroup" key={index}>
				<p style={{ width: "50%", overflow: "hidden" }}>{ user.login }</p>
				{loading.includes(user.id) ?
					<Loader />	:
					<IoIosAddCircleOutline className="addGroup" onClick={() => {addUserToGroup(user.id)}}/>
				}
			</div>
		))}
      </div>
    </div>
  );
}
