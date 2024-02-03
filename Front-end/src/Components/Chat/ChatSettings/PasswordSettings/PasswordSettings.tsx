import axios from 'axios';
import React, {Dispatch, SetStateAction, useState} from 'react';
import { API_BASE_URL } from '../../../../App';
import { useNotification } from '../../../../ContextNotification';
import { useSocket } from '../../../../ContextSocket';
import Loader from '../../../Loader/Loader';
import { Channel } from '../../Chat';
import "./PasswordSettings.css";

export default function PasswordSettings(
    { setChannels, selectedChat, currentPassword, closeAllWindows} : 
    { setChannels: Dispatch<SetStateAction<Channel[]>>, selectedChat: string, currentPassword: string | null, closeAllWindows: () => void }
    ){

    const showNotification = useNotification();
    const socket = useSocket();
    const [isRemovePassword, setIsRemovePassword] = useState(false);
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)

    const addPassword = async () => {
        setLoading(true)
        try {
            let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/password/add`, {
                password: password
            })

            socket?.emit("channelPasswordChanged", { channel: response.data })

            setChannels(oldChannels => {
                let editChannels = [...oldChannels]
                let index = editChannels.findIndex(channel => channel.id === selectedChat)
                editChannels[index] = response.data
                return editChannels;
            })
            setLoading(false)
            closeAllWindows()
        } catch(error) {
            setLoading(false)
            console.error(error)
            showNotification("ERROR_ADD_PASSWORD", "An error occured while adding a password to the channel")
        }
    }

    const updatePassword = async () => {
        if (isRemovePassword) {
            setLoading(true)
            try {
                let response = await axios.delete(`${API_BASE_URL}/channel/${selectedChat}/password/remove`)
                
                socket?.emit("channelPasswordChanged", { channel: response.data })

                setChannels(oldChannels => {
                    let editChannels = [...oldChannels]
                    let index = editChannels.findIndex(channel => channel.id === selectedChat)
                    editChannels[index] = response.data
                    return editChannels;
                })
                setLoading(false)
                closeAllWindows()
            } catch(error) {
                setLoading(false)
                console.error(error)
                showNotification("ERROR_REMOVE_PASSWORD", "An error occured while removing password from the channel")
            }
        } else {
            setLoading(true)
            try {
                let response = await axios.post(`${API_BASE_URL}/channel/${selectedChat}/password/update`, {
                    password: password
                })
                setChannels(oldChannels => {
                    let editChannels = [...oldChannels]
                    let index = editChannels.findIndex(channel => channel.id === selectedChat)
                    editChannels[index] = response.data
                    return editChannels;
                })
                setLoading(false)
                closeAllWindows()
            } catch(error) {
                setLoading(false)
                console.error(error)
                showNotification("ERROR_EDIT_PASSWORD", "An error occured while updating the channel's password")
            }
        }
    }

    return(
        <div className='containerPasswordSettings'>
            {currentPassword ?
                <>
                    <div className='infosPassword'>
                        <p className='pSettingsPassword'>Change Password :</p>
                        <input onChange={(e)=>{setPassword(e.currentTarget.value)}} disabled={isRemovePassword} type="password" className='inputPasswordSettings'></input>
                    </div>
                    <div className='infosPassword'>
                        <p className='pSettingsPassword'>Remove Password :</p>
                        <div className='containerRemovePassword'>
                            <div onClick={() => {setIsRemovePassword(false)}} style={{backgroundColor: !isRemovePassword ? "#FF5A5A" : ""}} className='removePassword'>no</div>
                            <div onClick={() => {setIsRemovePassword(true)}} style={{backgroundColor: isRemovePassword ? "green" : ""}} className='removePassword'>yes</div>
                        </div>
                    </div>
                    {loading ?
                        <button className='buttonPasswordSettings' disabled><Loader /></button> :
                        <button className='buttonPasswordSettings' onClick={updatePassword} disabled={!isRemovePassword && password === ""}>Save</button>
                    }
                </> :
                <>
                    <div className='infosPassword'>
                        <p className='pSettingsPassword'>Add a password :</p>
                        <input onChange={(e)=>{setPassword(e.currentTarget.value)}} type="password" className='inputPasswordSettings'></input>
                    </div>
                    {loading ?
                        <button className='buttonPasswordSettings' disabled><Loader /></button> :
                        <button onClick={addPassword} className='buttonPasswordSettings' disabled={password === ""}>Save</button>
                    }
                </>
            }
        </div>
    )

};
