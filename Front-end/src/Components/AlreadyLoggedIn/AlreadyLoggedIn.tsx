import Cookies from "js-cookie";
import "./AlreadyLoggedIn.css"

export default function AlreadyLoggedIn() {
    return (
        <div className="alreadyLoggedInContainer">
            <p className="alreadyLoggedInTitle">Already logged in with the following account</p>
            <p className="alreadyLoggedInName">{Cookies.get("login")}</p>
        </div>
    );
}