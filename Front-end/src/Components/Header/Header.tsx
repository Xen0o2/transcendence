import React, { useEffect, useState } from "react";
import "./Header.css";
import { color } from "../../config";
import { Link, useNavigate } from "react-router-dom";

import logo from "../../assets/logo.png";
import Cookies from "js-cookie";

export default function Header() {
  const [isPopupSetting, setIsPopupSetting] = useState(false);

  const profilClick = () => {
    setIsPopupSetting(!isPopupSetting);
  };

  const handleMouseLeave = () => {
    setIsPopupSetting(false);
  };

  const navigate = useNavigate()
  const handleLogout = () => {
    Object.keys(Cookies.get()).forEach(function(cookieName) {
      Cookies.remove(cookieName);
    });
    navigate("/login")
    window.location.reload()
  };

  return (
    <div
      className="containerHeader"
      onMouseLeave={handleMouseLeave}
      style={{ backgroundColor: color.primary }}
    >
      <div className="header" style={{ backgroundColor: color.primary }}>
        {isPopupSetting && (
          <div
            onMouseLeave={handleMouseLeave}
            className="popupHeader"
            style={{ backgroundColor: color.primary }}
          >
            <div className="containerSettingHeader" id="headerPhone">
              <div  className="settingHeader" >
                <Link to="/public/players" >Public</Link>
              </div>
              <div  className="settingHeader" >
                <Link to={`/profile/${Cookies.get("id")}/profile`} >Profile</Link>
              </div>
              <div  className="settingHeader" >
                <Link to="/about" >About</Link>
              </div>
            </div>
            <div className="containerSettingHeader">
            <div className="settingHeader">
              <Link to="/username">Edit profile</Link>
            </div>
            <div className="settingHeader">
              <Link to="/2fa">2FA</Link>
            </div>
            <div
              onClick={handleLogout}
              className="settingHeader"
              style={{ backgroundColor: "#FF5A5A", color: "white" }}
            >
              <p>Logout</p>
            </div>
            </div>
            
          </div>
        )}
        <div className="logo">
          <Link to="/">
            <img alt="logo" className="imgLogo" src={logo}></img>
          </Link>
        </div>
        <div className="menu">
          <div className="containerMenuText">
            <Link to={`/game`} className="textMenu">Game</Link>
          </div>
          <div className="containerMenuText">
            <Link to={`/public/players`} className="textMenu">Public</Link>
          </div>
          <div className="containerMenuText">
            <Link to={`/profile/${Cookies.get("id")}/profile`} className="textMenu">Profile</Link>
          </div>
          <div className="containerMenuText">
            <Link to={`/about`} className="textMenu">About us</Link>
          </div>
        </div>
        <div className="img">
          <img
            onClick={profilClick}
            alt="profilImage"
            className="imgHeader"
            src={Cookies.get("image")}
          ></img>
        </div>
      </div>
    </div>
  );
}
