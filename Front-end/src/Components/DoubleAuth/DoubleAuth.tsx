import React, { ChangeEvent, useState, useRef, KeyboardEvent, useEffect } from "react";
import "./DoubleAuth.css";
import { color } from "../../config";
import axios from "axios";
import { API_BASE_URL } from "../../App";
import { useNotification } from "../../ContextNotification";
import Cookies from "js-cookie";
import Loader from "../Loader/Loader";
import { useNavigate } from "react-router-dom";
import { User } from "../Chat/Chat";

export default function DoubleAuth() {
  
	const navigate = useNavigate();
	const showNotification = useNotification();
	const mailRef = useRef(null);
	const [messageSent, setMessageSent] = useState(false);
	const [user, setUser] = useState<User | null>();
	const [userLoading, setUserLoading] = useState(false);
	const [sendLoading, setSendLoading] = useState(false);
	const [enableLoading, setEnableLoading] = useState(false);
  
	const [valueNum, setValueNum] = useState<string[]>(["", "", "", "", "", ""]);
	const inputRefs = [
	useRef<HTMLInputElement>(null),
	useRef<HTMLInputElement>(null),
	useRef<HTMLInputElement>(null),
	useRef<HTMLInputElement>(null),
	useRef<HTMLInputElement>(null),
	useRef<HTMLInputElement>(null),
	];

  const handleInput = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.value.length === 1) {
      const newValue = e.target.value.charAt(0);
      const newArray = [...valueNum];
      newArray[index] = newValue;
      setValueNum(newArray);

      if (index < inputRefs.length - 1) {
        inputRefs[index + 1].current?.focus();
      }
    } else if (e.target.value.length === 0) {
      const newArray = [...valueNum];
      newArray[index] = "";
      setValueNum(newArray);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const newArray = [...valueNum];
  
      if (index > 0 && index < 5) {
        if (newArray[index] === "") {
          newArray[index - 1] = "";
          inputRefs[index - 1].current?.focus();
        } else {
          newArray[index] = "";
        }
      } else if (index === 0) {
        newArray[index] = "";
      } else if (index === 5) {
        if (newArray[index] !== ""){
          newArray[index] = "";
        } else if (newArray[index] === ""){
          newArray[index - 1] = "";
          inputRefs[index - 1].current?.focus();
        }
            
      }
  
      setValueNum(newArray);
    }
  };
	const sendMail = async () => {
		setSendLoading(true)
		try {
			if (!mailRef.current) return;
			if (!(mailRef.current["value"] as string).match(/.+@gmail\.com/))
				return showNotification("ERROR_MAIL_FORMAT", "Wrong mail format"), setSendLoading(false);
			await axios.post(`${API_BASE_URL}/mail/verify/${Cookies.get("id")}/`, {
				mail: mailRef.current["value"]
			})
			setMessageSent(true);
			setSendLoading(false);
		} catch(error) {
			setSendLoading(false)
			console.error(error)
			showNotification("ERROR_SEND_MAIL", "An error occured while sending verification mail");
		}
	}

	const enable2fa = async () => {
		setEnableLoading(true)
		try {
			if (valueNum.join("") == "" || !mailRef.current) return;
			let response = await axios.post(`${API_BASE_URL}/mail/verify/${Cookies.get("id")}/${valueNum.join("")}`, {
				mail: mailRef.current["value"]
			})
			if (response.data.status == 200){
				navigate("/")
				showNotification("2FA_ENABLED", "Successfully enabled 2FA")
			} else
				showNotification("ERROR_ENABLING", "Wrong code")
			setEnableLoading(false);
		} catch(error) {
			setEnableLoading(false)
			console.error(error)
			showNotification("ERROR_ENABLE_A2F", "An error occured while enabling 2fa");
		}
	}

	const disable2fa = async () => {
		setEnableLoading(true)
		try {
			let response = await axios.delete(`${API_BASE_URL}/mail/disable/${Cookies.get("id")}/`)
			setUser(response.data)
			showNotification("DISABLE_2FA", "Successfully disabled 2fa")
			setEnableLoading(false);
		} catch(error) {
			setEnableLoading(false)
			console.error(error)
			showNotification("ERROR_ENABLE_A2F", "An error occured while enabling 2fa");
		}	
	}

	useEffect(() => {
		const getUser = async () => {
			setUserLoading(true)
			try {
				let response = await axios.get(`${API_BASE_URL}/user/${Cookies.get("id")}`)
				setUser(response.data)
				setUserLoading(false)
			} catch(error) {
				setUserLoading(false)
				console.error(error)
				showNotification("ERROR_LOADING", "An error occured while loading")
			}
		}

		getUser();
	}, [])

  return (
    <div className="containerDoubleAuth">
      <div className="childDoubleAuth" style={{ backgroundColor: color.primary }}>
        <div className="title">
			<p>Two factor auth setup</p>
        </div>
		{userLoading && <Loader />}
		{!userLoading && user?.mail && 
			(enableLoading ?
				<button className="button2fa" style={{backgroundColor: "#FF5A5A", color: "white", padding: "30px", fontSize: "1.5rem"}} disabled><Loader /></button> :
				<button className="button2fa" style={{backgroundColor: "#FF5A5A", color: "white", padding: "30px", fontSize: "1.5rem"}} onClick={disable2fa}>Disable</button>
				)}
		{!userLoading && !user?.mail && 
			<>
				<div className="number2fa">
					<input ref={mailRef} className="input2fa" style={{width: "345px"}} placeholder="xxx@gmail.com" required disabled={messageSent}/>
					<div className="inputCode">
					{messageSent &&
						inputRefs.map((ref, index) => (
							<input
								key={index}
								value={valueNum[index]}
								onChange={(e) => handleInput(e, index)}
								onKeyDown={(e) => handleKeyDown(e, index)}
								className="inputNumber"
								maxLength={1}
								ref={ref}
							/>
							))}
					</div>
				</div>

				{messageSent ?
					(enableLoading ?
						<button className="button2fa" style={{backgroundColor: "green", color: "white"}} disabled><Loader /></button> :
						<button className="button2fa" style={{backgroundColor: "green", color: "white"}} onClick={enable2fa}>Enable</button>) :
						(sendLoading ? 
							<button className="button2fa" disabled><Loader /></button> :
							<button className="button2fa" onClick={sendMail}>Send</button>)
				}
			</>
		}
      </div>
    </div>
  );
}

