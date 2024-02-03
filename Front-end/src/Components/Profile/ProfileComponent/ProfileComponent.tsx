import "./ProfileComponent.css";
import Cookies from "js-cookie";
import { User } from "../../Chat/Chat";
import axios from "axios";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../App";
import Loader from "../../Loader/Loader";
import { color } from "../../../config";
import { useNotification } from "../../../ContextNotification";

export default function ProfileComponent() {

  	const { userId } = useParams()
	const showNotification = useNotification();
	
	const [user, setUser] = useState<User>();
	const [rank, setRank] = useState(0);
	const [loadingRank, setLoadingRank] = useState(false);

	useEffect(() => {
		const getUser = async() => {
			try {
				let response = await axios.get(`${API_BASE_URL}/user/${userId}`)
				setUser(response.data)
			} catch(error) {
				console.error(error)
				showNotification("ERROR_LOADING", "An error occured while loading")
			}
		}

		const getRank = async () => {
			setLoadingRank(true)
			try {
				let response = await axios.get(`${API_BASE_URL}/user/${userId}/getRank`)
				setRank(response.data);
				setLoadingRank(false)
			} catch(error) {
				setLoadingRank(false)
				console.error(error)
				showNotification("ERROR_LOADING", "An error occured while loading")
			}
		}

		getUser();
		getRank();
	}, [userId])

	return (
		<div className="containerProfil">
			<div className="childProfil" style={{ backgroundColor: color.primary }}>
				<div className="menuProfil">
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/profile`}>Profile</Link>
						<div className="borderBottomProfil"></div>
					</div>
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/history`}>History</Link>
					</div>
					{userId === Cookies.get("id") && 
						<div className="categoryProfil">
							<Link className="textCategoryProfil" to={`/profile/${userId}/friends`}>Friends</Link>
						</div>}
				</div>
				{!user && <div style={{padding: "240px"}}><Loader /></div>}
				{user &&
					<div className="contentProfil">
						<div className="leftProfil">
							<div className="photoProfil">
								<img alt="imgProfil" className="imgProfil" src={user.image}></img>
							</div>
						</div>
						<div className="rightProfil">
							<div className="containerInputNameprofil">
								<div className="inputNameProfil">
								<p>{user.firstname + " " + user.lastname + " (" + user.login + ")"}</p>
								</div>
							</div>
							<div className="scoreProfil">
								<div className="infosScore">
									<div className="leftInfosScore">Victories</div>
									<div className="rightInfosScore">{user.victory}</div>
								</div>
								<div className="infosScore">
									<div className="leftInfosScore">Defeats</div>
									<div className="rightInfosScore">{user.defeat}</div>
								</div>
								<div className="infosScore">
									<div className="leftInfosScore">Rank</div>
									{loadingRank ?
										<div className="rightInfosScore"><Loader /></div> :
										<div className="rightInfosScore">{rank}</div>
									}
								</div>
								<div className="infosScore">
									<div className="leftInfosScore">Level</div>
									<div className="rightInfosScore">{user.level}</div>
								</div>
							</div>
						</div>
					</div>}
			</div>
		</div>
    );
}
