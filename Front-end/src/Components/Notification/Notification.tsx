import React from 'react';
import "./Notification.css";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoMdNotifications } from "react-icons/io";


export default function Notification({id, content, closeFunction, index} : {id: string, content : string, closeFunction : any, index: number}){
    return(
        <div className='containerNotification' style={{backgroundColor: (id.startsWith("ERROR") ? "#FF5A5A" : "#009688")}}>
          <div className='containerTitleNotification'> 
            <p className='titleNotification'>Notification</p>
						<div>
            <IoMdNotifications className='logoNotification' />
						<IoCloseCircleOutline onClick={()=>closeFunction(index)} className='logoCloseNotif'/>
						</div>
          </div>
            <div className='childNotification'>
                <p className='messageNotification'> { content }  </p>
           </div>
        </div>
    )
}