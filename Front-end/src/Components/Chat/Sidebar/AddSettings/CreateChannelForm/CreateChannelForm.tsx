import { Dispatch, FormEvent, SetStateAction, useEffect, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../App";
import Cookies from "js-cookie";
import fs from "fs"
import { Channel } from "../../../Chat";
import Loader from "../../../../Loader/Loader";

export default function CreateChannelForm({setChannels, closeAllWindows}: {setChannels: Dispatch<SetStateAction<Channel[]>>, closeAllWindows: () => void}){

    const [showPassword, setShowPassword] = useState(false);
    const [privatePublic, setPrivePublic] = useState(0);
    const [loading, setLoading] = useState(false)

    const channelName = useRef<HTMLInputElement | null>(null);
    const password = useRef<HTMLInputElement | null>(null);

    const HandlePublic = () => {
		setPrivePublic(0);
		setShowPassword(false);
        if (password.current)
            password.current.value = ""
	};

	const HandlePrivate = () => {
        setPrivePublic(1);
        setShowPassword(true);
        if (password.current)
            password.current.value = ""
	};


    const handleCreateChannel = async (event: FormEvent) => {
        event.preventDefault()
        if (channelName.current && password.current){
            if (channelName.current.value === "" || Cookies.get("id") === null) return
            setLoading(true)
            try {
                let response = await axios.put(`${API_BASE_URL}/channel/create`, {
                      prisma: {
                        name: channelName.current.value,
                        password: password.current.value,
                        type: privatePublic ? "PRIVATE" : "PUBLIC",
                        ownerId: Cookies.get("id"),
                        admins: {
                          connect: {
                            id: Cookies.get("id")
                          }
                        },
                        users: {
                          connect: {
                            id: Cookies.get("id")
                          }
                        }
                      }
                });
                closeAllWindows()
                setChannels((oldChannels: Channel[]): any => {
                  return [...oldChannels, response.data]
                })
                setLoading(false)
            } catch(error) {
                console.log(error)
                setLoading(false)
            }
        }
    }

    return (
        <form className="containerOptionSetting" onSubmit={handleCreateChannel}>
          <input placeholder="Channel Name" className="inputChatSetting" maxLength={15} ref={channelName} required></input>
          <div className="ctnOptChnl">
            <div
              onClick={HandlePublic}
              className="buttonCtnOptChnl"
              style={{
                backgroundColor: privatePublic === 0 ? "green" : "white",
                color: privatePublic === 0 ? "white" : "black",
              }}
            >
              Public
            </div>
            <div
              onClick={HandlePrivate}
              className="buttonCtnOptChnl"
              style={{
                backgroundColor: privatePublic === 1 ? "green" : "white",
                color: privatePublic === 1 ? "white" : "black",
              }}
            >
              Private
            </div>
          </div>
          <input placeholder="Password" className="inputChatSetting" disabled={showPassword} type="password" ref={password}></input>
          {loading ? 
            <button className="buttonValidateSetngChannel" type="submit" disabled><Loader /></button>:
            <button className="buttonValidateSetngChannel" type="submit">Create</button>
          }
        </form>
    )
}