import React from "react";
import "./Login.css";
import { CLIENT_ID, color } from "../../config";
import { REDIRECT_URI } from "../../App";
import Loader from "../Loader/Loader";

export default function Login({
  error,
  loading,
}: {
  error: Boolean;
  loading: Boolean;
}) {
  const login_url =
    "https://api.intra.42.fr/oauth/authorize" +
    "?client_id=" + CLIENT_ID +
    "&redirect_uri=" + REDIRECT_URI +
    "&response_type=code";

  return (
    <div className="containerLogin">
      <div style={{ backgroundColor: color.primary }} className="windowLogin">
        <div className="topLogin">
          <p className="titleLogin">Transcendence</p>
		  <p className="subtitleLogin">Login with 42</p>
          {error ? <p className="errorLogin">Error during connection</p> : ""}
        </div>
        <div className="bodyLogin">
			{(loading && !error) ?
				<p className="chargementLogin"><Loader /></p>: 
				<a className="buttonLogin" href={login_url}>Log in</a>
			}
        </div>
      </div>

      <ul className="circles">
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
        <li></li>
      </ul>
    </div>
  );
}
