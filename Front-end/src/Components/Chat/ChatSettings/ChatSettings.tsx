import "./ChatSettings.css";
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from "react";
import { color } from "../../../config";
import { GrReturn } from "react-icons/gr";
import { ImCross } from "react-icons/im";
import { FaBan, FaVolumeUp } from "react-icons/fa";
import { FaVolumeMute } from "react-icons/fa";

import AddMember from "./AddMember/AddMember";
import { Channel, User } from "../Chat";
import AddAdmin from "./AddAdmin/AddAdmin";
import axios from "axios";
import { API_BASE_URL } from "../../../App";
import Cookies from "js-cookie";
import Loader from "../../Loader/Loader";
import PasswordSettings from "./PasswordSettings/PasswordSettings";
import { useSocket } from "../../../ContextSocket";
import { useNotification } from "../../../ContextNotification";
import { Link } from "react-router-dom";


export default function ChatSettings(
  { channels, setChannels, selectedChat, setSelectedChat, closeAllWindows }:
  { channels: Channel[], setChannels: Dispatch<SetStateAction<Channel[]>>, selectedChat: string, setSelectedChat: Dispatch<SetStateAction<string>>, closeAllWindows: () => void }) {
	
	const showNotification = useNotification();
	const socket = useSocket()

    const [channelSettings, setChannelSettings] = useState<Channel | undefined>(channels.find(channel => channel.id === selectedChat));
    
	const [showSetting, setShowSetting] = useState(true); 
    const [showSettingAdmin, setShowSettingAdmin] = useState(false);
    const [showSettingMembers, setShowSettingMembers] = useState(false);
    const [showSettingBanned, setShowSettingBanned] = useState(false);
    const [showAddAdmin, setShowAddAdmin] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [showPasswordSettings, setShowPasswordSettings] = useState(false);

    const [loadingRemoveAdmin, setLoadingRemoveAdmin] = useState<string[]>([])
    const [loadingModeration, setLoadingModeration] = useState<string[]>([])
	const [loadingUnban, setLoadingUnban] = useState<string[]>([])
    const [loadingDelete, setLoadingDelete] = useState(false)
    const [loadingLeave, setLoadingLeave] = useState(false)

  const handleClickSee = (value: string) => {
    setShowSetting(false);

	setShowSettingAdmin(value === "admin")
	setShowSettingMembers(value === "members")
	setShowSettingBanned(value === "banned")
  };

  const handleReturn = () => {
    setShowSettingAdmin(false);
    setShowSettingMembers(false);
	setShowSettingBanned(false)
    setShowAddAdmin(false);
    setShowAddMember(false);
    setShowPasswordSettings(false);
    setShowSetting(true);
  };

  const handleAdd = (infos: string) => {
    setShowSettingAdmin(false);
    setShowSettingMembers(false);
    if (infos === "admin") {
      setShowAddAdmin(true);
    } else if (infos === "member") {
      setShowAddMember(true);
    }
  };

  const handleSettingsPassword = () => {
    setShowSetting(false);
    setShowPasswordSettings(true);
  };

  	useEffect(() => {
    	setChannelSettings(channels.find(channel => channel.id === selectedChat));
    }, [channels, selectedChat]);


	const removeUserFromGroup = async (userId: string) => {
    	setLoadingModeration(old => [...old, userId])
		try {
			let response = await axios.delete(`${API_BASE_URL}/channel/${selectedChat}/removeUser/${userId}`)

			socket?.emit("removeUserFromChannel", { channel: response.data, userId })

			setChannels(oldChannels => {
				let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
      		setLoadingModeration(old => old.filter(id => id !== userId))
		} catch(error) {
			setLoadingModeration(old => old.filter(id => id !== userId))
			console.error(error)
			showNotification("ERROR_REMOVE_USER_FROM_CHANNEL", "An error occured while removing user from channel")
		}
	}
	
	const removeUserFromAdmins = async (userId: string) => {
    	setLoadingRemoveAdmin(old => [...old, userId])
		try {
      		let response = await axios.delete(`${API_BASE_URL}/channel/${selectedChat}/removeAdmin/${userId}`)

			socket?.emit("removeAdminFromAdmins", { channel: response.data, userId })

			setChannels(oldChannels => {
        		let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
      		setLoadingRemoveAdmin(old => old.filter(id => id !== userId))
		} catch(error) {
			setLoadingRemoveAdmin(old => old.filter(id => id !== userId))
			console.error(error)
			showNotification("ERROR_REMOVE_ADMIN", "An error occured while removing administrator")
		}
	}

	const banUserFromChannel = async (userId: string) => {
    	setLoadingModeration(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/ban/${userId}`)

			socket?.emit("banUserFromChannel", { channel: response.data, userId })

			setChannels(oldChannels => {
        		let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
			setLoadingModeration(old => old.filter(id => id !== userId))
		} catch(error) {
			setLoadingModeration(old => old.filter(id => id !== userId))
			console.error(error)
			showNotification("ERROR_UNBAN_USER", "An error occured while banning user from channel")
		}
	}

	const unbanUserFromChannel = async (userId: string) => {
		setLoadingUnban(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/unban/${userId}`)

			socket?.emit("unbanUserFromChannel", { channel: response.data, userId })

			setChannels(oldChannels => {
        		let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
			setLoadingUnban(old => old.filter(id => id !== userId))
		} catch(error) {
			setLoadingUnban(old => old.filter(id => id !== userId))
			console.error(error)
			showNotification("ERROR_BAN_USER", "An error occured while unbanning user from channel")
		}
	}

	const muteUser = async (userId: string) => {
		setLoadingModeration(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/mute/${userId}`)

			socket?.emit("muteUserInChannel", { channel: response.data, userId })

			setChannels(oldChannels => {
				let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
			setLoadingModeration(old => old.filter(id => id !== userId))		
		} catch(error) {
			setLoadingModeration(old => old.filter(id => id !== userId))	
			console.error(error)
			showNotification("ERROR_MUTE_USER", "An error occured while muting user from channel")
		}
	}

	const unmuteUser = useCallback(async (userId: string) => {
		setLoadingModeration(old => [...old, userId])
		try {
			let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/unmute/${userId}`)

			socket?.emit("unmuteUserInChannel", { channel: response.data, userId })
			
			setChannels(oldChannels => {
				let editChannels = [...oldChannels]
				let index = editChannels.findIndex(channel => channel.id === response.data.id)
				editChannels[index] = response.data
				return editChannels
			})
			setLoadingModeration(old => old.filter(id => id !== userId))	
		} catch(error) {
			setLoadingModeration(old => old.filter(id => id !== userId))	
			console.error(error)
			showNotification("ERROR_UNMUTE_USER", "An error occured while unmuting user from channel")
		}
	}, [selectedChat, setChannels, socket])
	
	const deleteChannel = async () => {
    	setLoadingDelete(true)
		try {
			let response = await axios.delete(`${API_BASE_URL}/channel/delete/${selectedChat}`)

			socket?.emit("deleteChannel", { channel: response.data })

			setSelectedChat("")
			closeAllWindows()
			setChannels(oldChannels => {
				let editChannels = [...oldChannels.filter(channel => channel.id !== response.data.id)]
				return editChannels
			})
      	setLoadingDelete(false)
		} catch(error) {
			console.error(error)
			showNotification("ERROR_DELETING_CHANNEL", "An error occured while deleting the channel")
			setLoadingDelete(false)
		}
	}

	const leaveChannelAsOwner = async () => {
		try {
		let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/leaveAsOwner/${Cookies.get("id")}`)

		socket?.emit("ownerLeaveChannel", { channel: response.data })

		setChannels(oldChannels => {
					let editChannels = [...oldChannels.filter(channel => channel.id !== response.data.id)]
					return editChannels
				})
		} catch(error) {
			console.error(error)
			showNotification("ERROR_LEAVING_CHANNEL", "An error occured while leaving the channel")
		}
	}
	
	const leaveChannelAsUser = async () => {
		try {
		let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/leaveAsUser/${Cookies.get("id")}`)
		
		socket?.emit("userLeaveChannel", { channel: response.data })

		setChannels(oldChannels => {
			let editChannels = [...oldChannels.filter(channel => channel.id !== response.data.id)]
			return editChannels
		})
		} catch(error) {
		console.error(error)
		showNotification("ERROR_LEAVING_CHANNEL", "An error occured while leaving the channel")
	}
	}
	
	const leaveChannel = async () => {
		setLoadingLeave(true)
		if (channelSettings?.ownerId === Cookies.get("id")){
			if (channelSettings?.admins.length === 1)
				await deleteChannel()
			else
				await leaveChannelAsOwner()
		} else
			await leaveChannelAsUser()
		setLoadingLeave(false)
		closeAllWindows()
	}

	useEffect(() => {
		channelSettings?.muted.forEach(muted => {
			let createdAt = new Date(muted.createdAt).getTime()
			let timeleft = ((600000 - Date.now() + createdAt) / 60000)
			if (timeleft < 1) unmuteUser(muted.userId)
		})
	}, [showSetting, unmuteUser, channelSettings?.muted])

  	return (
    <div
      className="containerSettingGroup"
      style={{ backgroundColor: color.secondary }}
    >
      <div className="titleSettingGroup">
        <p style={{ fontSize: "20px", borderBottom: "1px solid white" }}>
          Setting Group
        </p>
      </div>
      {!showSetting && (<GrReturn onClick={handleReturn} className="returnGroup" />)}
      {showSetting && (
        <div className="containerSettingGroupChild">
          <div className="containerInfosGroup">
            <p className="pInfosGroup">Owner : </p>
            <p>{channelSettings?.owner?.login}</p>
          </div>
          <div className="containerInfosGroup">
            <p className="pInfosGroup">Admin : </p>
            <p>{channelSettings?.admins.length}</p>
            <button onClick={() => { handleClickSee("admin"); }} className="seeButtonGroup">See</button>
          </div>
          <div className="containerInfosGroup">
            <p className="pInfosGroup">Members : </p>
            <p>{channelSettings?.users.length}</p>
            <button onClick={() => { handleClickSee("members"); }} className="seeButtonGroup">See</button>
          </div>
		  {channelSettings?.ownerId === Cookies.get("id") && 
			<div className="containerInfosGroup">
				<p className="pInfosGroup">Banned : </p>
				<p>{channelSettings?.banned.length}</p>
				<button onClick={() => { handleClickSee("banned"); }} className="seeButtonGroup">See</button>
			</div>}

          <div className="containerInfosGroup">
            {(channelSettings?.ownerId === Cookies.get("id") && channelSettings?.type == "PUBLIC") &&
              <>
                <p className="pInfosGroup">Password : </p>
                {channelSettings?.password === null ? 
                    <button onClick={handleSettingsPassword} className="seeButtonGroup">Add</button> : 
                    <button onClick={handleSettingsPassword} className="seeButtonGroup">Setting</button>}
              </>
            }
          </div>

          <div className="horizontalButtons">
            {channelSettings?.ownerId === Cookies.get("id") ?
              loadingDelete ? <button className="deleteButtonGroup" disabled><Loader /></button> :
              <button className="deleteButtonGroup" onClick={deleteChannel}>Delete channel</button> :
              null
            }
            {loadingLeave ? 
              <button className="deleteButtonGroup" disabled><Loader /></button> :
              <button className="deleteButtonGroup" onClick={leaveChannel}>Leave channel</button>
            }
            </div>
        </div>
      )}

      {showSettingAdmin && (
        <div className="containerSettingGroupChild">
          <p>Admin</p>
          <div className="containerAdmn">
            {channelSettings?.admins.map((admin: User, index: number) => (
              <div className="memberGroup" key={index}>
				<Link to={`/profile/${admin.id}/profile`} className="username">{admin.login}</Link>
				{/*Bouton supprimer un admin seulement pour le propriétaire du salon*/}
                {channelSettings.ownerId !== admin.id && Cookies.get("id") === channelSettings.ownerId ?
					(loadingRemoveAdmin.includes(admin.id) ?
					<Loader /> :
					<ImCross className="crossGroup" onClick={() => {removeUserFromAdmins(admin.id)}}/>) :
                  	<ImCross style={{color: "gray", cursor: "not-allowed"}}/>
                }
              </div>
            ))}
          </div>
		  {channelSettings?.ownerId === Cookies.get("id") && <button onClick={() => { handleAdd("admin"); }} className="buttonAddGroup">Add Admin</button>}
        </div>
      )}

      {showSettingMembers && (
        <div className="containerSettingGroupChild">
          <p>Members</p>
          <div className="containerAdmn">
            {channelSettings?.users.map((user: User, index: number) => (
              <div className="memberGroup" key={index}>
				<Link to={`/profile/${user.id}/profile`} className="username">{user.login}</Link>
                {/*Boutons de modération seulement pour les admins et le owner*/}
                {channelSettings.ownerId !== user.id && channelSettings.admins.find(u => u.id === Cookies.get("id")) ?
					(loadingModeration.includes(user.id) ? 
						<Loader /> :
						<>
							<FaBan title="Ban user from the channel" onClick={() => { banUserFromChannel(user.id) }} className="banGroup" />
							{channelSettings.muted.find(muted => muted.userId === user.id) ?
								<FaVolumeMute title="Unmute user" onClick={() => { unmuteUser(user.id) }} className="muteGroup"/> :
								<FaVolumeUp title="Mute user" onClick={() => { muteUser(user.id) }} className="muteGroup"/>
							}
							<ImCross title="Kick user from the channel" className="crossGroup" onClick={() => { removeUserFromGroup(user.id) }}/>
						</>) :
					<>
					<FaBan style={{color: "gray", cursor: "not-allowed", transform: "scale(1.3)"}}/>
					{channelSettings.muted.find(muted => muted.userId === user.id) ?
						<FaVolumeMute style={{color: "gray", cursor: "not-allowed", transform: "scale(1.3)"}} title="Unmute user" onClick={() => { unmuteUser(user.id) }} className="muteGroup"/> :
						<FaVolumeUp style={{color: "gray", cursor: "not-allowed", transform: "scale(1.3)"}} title="Mute user" onClick={() => { muteUser(user.id) }} className="muteGroup"/>
					}
					<ImCross style={{color: "gray", cursor: "not-allowed"}}/>
					</>
                }
       
              </div>
            ))}
          </div>
		  {channelSettings?.admins.find(admin => admin.id === Cookies.get("id")) && <button onClick={() => { handleAdd("member"); }} className="buttonAddGroup">Add Member</button>}
        </div>
      )}
      
	  {showSettingBanned && (
        <div className="containerSettingGroupChild">
          <p>Banned</p>
          <div className="containerAdmn">
			{channelSettings?.banned.length === 0 && <center>No user banned</center>}
            {channelSettings?.banned.map((user: User, index: number) => (
              <div className="memberGroup" key={index}>
                <p style={{ width: "50%", overflow: "hidden" }}>{user.login}</p>
                {loadingUnban.includes(user.id) ? 
                    <Loader /> :
                    <ImCross title="Unban user from the channel" className="crossGroup" onClick={() => {unbanUserFromChannel(user.id)}}/>}
              </div>
            ))}
          </div>
        </div>
      )}

      {showAddAdmin && <AddAdmin setChannels={setChannels} selectedChat={selectedChat} usersInGroup={channelSettings!.users} adminsInGroup={channelSettings!.admins} />}
      {showAddMember && <AddMember setChannels={setChannels} selectedChat={selectedChat} users={channelSettings!.users} />}
      {showPasswordSettings && <PasswordSettings setChannels={setChannels} selectedChat={selectedChat} currentPassword={channelSettings!.password} closeAllWindows={closeAllWindows} />}

    </div>
  );
}
