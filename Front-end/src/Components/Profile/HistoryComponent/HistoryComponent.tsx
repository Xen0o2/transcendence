import axios from "axios";
import Cookies from "js-cookie";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { API_BASE_URL } from "../../../App";
import { color } from "../../../config";
import { useNotification } from "../../../ContextNotification";
import { Match, User } from "../../Chat/Chat";
import Loader from "../../Loader/Loader";
import "./HistoryComponent.css";

export default function HistoryComponent() {
  
  	const { userId } = useParams()
	const showNotification = useNotification();

	const [_, setUser] = useState<User>();
	const [matches, setMatches] = useState<Match[]>([]);
	const [loadingMatch, setLoadingMatch] = useState(false);

	useEffect(() => {
		const getUser = async() => {
			try {
				setLoadingMatch(true)
				let response = await axios.get(`${API_BASE_URL}/user/${userId}`)
				setUser(response.data)
				setMatches([...response.data.matches1, ...response.data.matches2].sort((match2: Match, match1: Match) => {
					return new Date(match1.createdAt).getTime() - new Date(match2.createdAt).getTime()
				}))
				setLoadingMatch(false)
			} catch(error) {
				setLoadingMatch(false)
				console.error(error)
				showNotification("ERROR_LOADING", "An error occured while loading")
			}
		}

		getUser()
	}, [userId])
  
	return (
    	<div className="containerProfil">
      		<div className="childProfil" style={{ backgroundColor: color.primary }}>
				<div className="menuProfil">
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/profile`}>Profile</Link>
					</div>
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/history`}>History</Link>
						<div className="borderBottomProfil"></div>
					</div>
					{userId === Cookies.get("id") && 
						<div className="categoryProfil">
							<Link className="textCategoryProfil" to={`/profile/${userId}/friends`}>Friends</Link>
						</div>}
				</div>
				<div className="containerHistory">
					{loadingMatch && <Loader />}
					{!loadingMatch && matches.length === 0 && <p style={{color: "white"}}>No matches played</p>}
					{!loadingMatch && matches.map(match => (
						<div className="contentHistory" style={{ backgroundColor: match.winnerid ? (match.winnerid === userId ? "#35C84D" : "#FF5A5A") : "gray" }}>
							{match.winnerid === null ?
								<p className="p">Draw</p> :
								(match.winnerid === userId ?
									<p className="p">Winned</p> :
									<p className="p">Losed</p>)
							}
							
							<table>
								<tr>
									<td>{match.user1.login}</td>
									<td>{match.user2.login}</td>
								</tr>
								<tr>
									<td>{match.scoreUser1}</td>
									<td>{match.scoreUser2}</td>
								</tr>
							</table>
							<p className="pHistory">{match.createdAt.match(/(\d{4}-\d{2}-\d{2})/)?.[1]?.split('-').reverse().join(' / ')}</p>
						</div>
					))}
				</div>
        	</div>
    	</div>);
}
