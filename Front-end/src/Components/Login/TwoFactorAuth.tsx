import axios from "axios";
import Cookies from "js-cookie";
import { ChangeEvent, useEffect, useRef, KeyboardEvent, useState, Dispatch, SetStateAction } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../App";
import { color } from "../../config";
import { useNotification } from "../../ContextNotification";
import { User } from "../Chat/Chat";
import Loader from "../Loader/Loader";

export default function TwoFactorAuth({ user, setUpdate }: { user: User, setUpdate: Dispatch<SetStateAction<boolean>> }) {
    
    const showNotification = useNotification();
    const navigate = useNavigate();

    const [canSendMail, setCanSendMail] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
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

    // const canSendMail = () => {
    //     if (Cookies.get("last2faMail")) {
    //         let timestamp = parseInt(Cookies.get("last2faMail")!)
    //         console.log((Date.now() - timestamp) > 30000)
    //         return (Date.now() - timestamp) > 30000
    //     } else
    //         return true;
    // }

    const sendMail = async (notification: boolean) => {
        let timestamp = parseInt(Cookies.get("last2faMail") || "0")
        if (!canSendMail && timestamp) {
            let timeRemaining = (30 - Math.round((Date.now() - timestamp) / 1000))
            if (timeRemaining > 1) {
                setTimeout(() => {
                    setCanSendMail(true)
                }, Date.now() - timestamp);
                setCanSendMail(true)
                return showNotification("ERROR_COOLDOWN_MAIL", "Please wait " + timeRemaining.toString() + " seconds...");
            }
        }
        if (notification)
            showNotification("NEW_MAIL_SENT", "A new mail has been sent by email")
        try {
            await axios.post(`${API_BASE_URL}/mail/verify/${user.id}`, {
                mail: user.mail
            })
            Cookies.set("last2faMail", Date.now().toString())
            setCanSendMail(false);
            setTimeout(() => {
                setCanSendMail(true);
            }, 30000);
        } catch(error) {
            console.error(error)
            showNotification("ERROR_SEND_MAIL", "An error occured while sending 2fa mail")
        }
    }

    const login2fa = async () => {
		setLoginLoading(true)
		try {
			if (valueNum.join("") == "") return;
			let response = await axios.post(`${API_BASE_URL}/mail/verify/${Cookies.get("id")}/${valueNum.join("")}`, {
				mail: user.mail
			})
			if (response.data.status == 200) {
                Cookies.set("2fa", "OK")
                setUpdate(old => !old);
				showNotification("2FA_CONNECTED", "Successfully connected")
			} else
				showNotification("ERROR_ENABLING", "Wrong code")
			setLoginLoading(false);
		} catch(error) {
			setLoginLoading(false)
			console.error(error)
			showNotification("ERROR_ENABLE_A2F", "An error occured while enabling 2fa");
		}
	}

    useEffect(() => {
        if (Cookies.get("last2faMail")) {
            let timestamp = parseInt(Cookies.get("last2faMail")!)
            if((Date.now() - timestamp) > 30000)
                setCanSendMail(true)
        }
        sendMail(false);
    }, [])

    return (
        <div className="containerDoubleAuth">
            <div className="doubleAuthModal" style={{ backgroundColor: color.primary }}>
                <div className="title">
                    <p>Two factor auth setup</p>
                </div>
                <p className="descriptionDoubleAuth">An email has been sent to</p>
                <p className="descriptionDoubleAuth">{user.mail}</p>
                <div className="body2fa">
					<div className="inputCode">
                    {inputRefs.map((ref, index) => (
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
                <div className="login2fa">
                    {loginLoading ?
                        <button className="loginButton2fa" disabled={true}><Loader /></button> :
                        <button className="loginButton2fa" disabled={valueNum.join("").length !== 6} onClick={login2fa}>Login</button>
                    }
                    {canSendMail ?
                        <span className="resend2fa" onClick={() => {sendMail(true)}}>Resend mail</span> :
                        <span className="resend2fa disabled">Resend mail</span>
                    }
                </div>
            </div>
        </div>
    )
}