import "../AddMember/AddMember.css";
import { Dispatch, SetStateAction, useState } from "react";
import { IoIosAddCircleOutline } from "react-icons/io";
import axios from "axios";
import { API_BASE_URL } from "../../../../App";
import { Channel, User } from "../../Chat";
import Loader from "../../../Loader/Loader";
import { useSocket } from "../../../../ContextSocket";
import { useNotification } from "../../../../ContextNotification";

export default function AddAdmin(
	{setChannels, selectedChat, usersInGroup, adminsInGroup}: 
	{setChannels: Dispatch<SetStateAction<Channel[]>>, selectedChat: string, usersInGroup: User[], adminsInGroup: User[] }) {

	const showNotification = useNotification();
	const socket = useSocket();
	const [loading, setLoading] = useState<string[]>([])

	const addAdminToGroup = async (userId: string) => {
		setLoading(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/addAdmin/${userId}`)

			socket?.emit("addAdminToChannel", { channel: response.data, userId })

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
			showNotification("ERROR_ADD_ADMIN_CHANNEL", "An error occured while adding an administrator")
		}
	}


  return (
    <div className="containerSettingGroupChild">
      <p>Add Admin</p>
      <div className="scrollAddAdmin">
		{usersInGroup.filter(user => !adminsInGroup.find(admin => admin.id === user.id)).length === 0 && <center>Vous n'avez personne à ajouter</center>}
		{usersInGroup.filter(user => !adminsInGroup.find(admin => admin.id === user.id)).map((user: User, index: number) => (
			<div className="memberGroup" key={index}>
				<p style={{ width: "50%", overflow: "hidden" }}>{ user.login }</p>
				{loading.includes(user.id) ? 
					<Loader /> :	
					<IoIosAddCircleOutline className="addGroup" onClick={() => {addAdminToGroup(user.id)}}/>
				}
			</div>
		))}
      </div>
    </div>
  );
}
