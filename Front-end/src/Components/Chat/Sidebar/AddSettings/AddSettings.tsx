import "./AddSettings.css";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { color } from "../../../../config";
import CreateChannelForm from "./CreateChannelForm/CreateChannelForm";
import { Channel, DMChannel } from "../../Chat";
import SendDM from "./SendDM/SendDM";

export default function AddSettings(
	{setSelectedChat, setChannels, setDMChannels, closeAllWindows}: 
	{setSelectedChat: Dispatch<SetStateAction<string>>, setChannels: Dispatch<SetStateAction<Channel[]>>, setDMChannels: Dispatch<SetStateAction<DMChannel[]>>, closeAllWindows: () => void}) {
	const [showChatSetting, setShowChatSetting] = useState(true);
	const [addChannel, setAddChannel] = useState(false);
	const [sendMp, setSendMp] = useState(false);


	const HandleClickChannel = () => {
		setAddChannel(true);
		setShowChatSetting(false);
	};
	const HandleClickSendMp = () => {
		setSendMp(true);
		setShowChatSetting(false);
	};

	useEffect(() => {}, []);

	return (
	<div
		className="containerSettingChat"
		style={{ backgroundColor: color.secondary }}
	>
		<p className="pChatSetting">Add channel or msg</p>
		{showChatSetting === true && (
		<div className="containerOptionSetting">
			<button onClick={HandleClickChannel} className="buttonSettingChat">Add Channel +</button>
			<button onClick={HandleClickSendMp} className="buttonSettingChat">Send Mp + </button>
		</div>
		)}
		{addChannel && (<CreateChannelForm setChannels={setChannels} closeAllWindows={closeAllWindows} />)}
		{sendMp && (<SendDM setSelectedChat={setSelectedChat} setDMChannels={setDMChannels} closeAllWindows={closeAllWindows} />)}
	</div>
	);
	}
