import React from "react";
import "./Login.css";
import { color } from "../../config";
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
    "?client_id=u-s4t2ud-68346e25a5e2e6dfab2d06f70bc9693aa84084e271c194a8d32a84e5d2d6ab57" +
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
