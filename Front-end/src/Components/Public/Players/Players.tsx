import axios from "axios"
import Cookies from "js-cookie"
import { useEffect, useState } from "react"
import { API_BASE_URL } from "../../../App"
import { DMChannel, Friendship, User } from "../../Chat/Chat"
import UserPComponent from "./UserPComponent/UserPComponent"
import "../Channels/Channels.css"
import Loader from "../../Loader/Loader"
import { color } from "../../../config"
import { Link } from "react-router-dom"
import { useSocket } from "../../../ContextSocket"
import { useNotification } from "../../../ContextNotification"

export default function Players(){

	const showNotification = useNotification();
	const socket = useSocket();

    const [users, setUsers] = useState<User[]>([])
	const [usersStatus, setUsersStatus] = useState<{userId: string, status: number}[]>([])
	const [loading, setLoading] = useState(false)
	const [searchResult, setSearchResult] = useState<User[]>([])
	const [username, setUsername] = useState("")
	const [typing, setTyping] = useState(false)

	const searchUsers = async () => {
		setLoading(true)
		try {
			let response = await axios.get(`${API_BASE_URL}/user/users/${username}`)
			setSearchResult(response.data.filter((user: User) => user.id !== Cookies.get("id")))
			setLoading(false)
		} catch(error) {
			setLoading(false)
			console.error(error)
			showNotification("ERROR_SEARCH_USER", "An error occured while searching for users")
		}
	}

	const getUsers = async () => {
		setLoading(true)
		try {
			let response = await axios.get(`${API_BASE_URL}/user/otherUsers/${Cookies.get("id")}`)
			setUsers(response.data)
			setLoading(false)
		} catch(e) {
			setLoading(false)
			showNotification("ERROR_GETTING_USERS_LIST", "An error occured while getting users list")
		}
	}

    useEffect(() => {
		
		socket?.emit("getUsersStatus")

		socket?.on("usersStatus", (data: { userId: string, status: number }[]) => {
			setUsersStatus(data);
		})

		socket?.on("hasBeenBlocked", (data: { dmchannel: DMChannel, user: User }) => {
			if (username === "")
				getUsers();
			else
				searchUsers();
			showNotification("ERROR_HAS_BEEN_BLOCKED", `${data.dmchannel.user1.id === data.user.id ? data.dmchannel.user2.login : data.dmchannel.user1.login} has blocked you`)
		})

		socket?.on("hasBeenUnblocked", (data: { dmchannel: DMChannel, user: User }) => {
			if (username === "")
				getUsers();
			else
				searchUsers();
			showNotification("HAS_BEEN_UNBLOCKED", `${data.dmchannel.user1.id === data.user.id ? data.dmchannel.user2.login : data.dmchannel.user1.login} has unblocked you`)
		})

		socket?.on("receiveFriendRequest", (data: { friendship: Friendship, user: User}) => {
			if (username === "")
				getUsers();
			else
				searchUsers();
			showNotification("RECEIVE_FRIEND_REQUEST", `${data.friendship.user1id === data.user.id ? data.friendship.user2.login : data.friendship.user1.login} sent you a friend request`)
		})

		socket?.on("friendRequestAccepted", (data: { user: User, login: string }) => {
			if (username === "")
				getUsers();
			else
				searchUsers();
			showNotification("FRIEND_REQUEST_ACCEPTED", `${data.login} accept your friend request`)

		})
		
		socket?.on("friendRequestDeclined", (data: { dmchannel: DMChannel, user: User }) => {
			if (username === "")
				getUsers();
			else
				searchUsers();
			showNotification("ERROR_FRIEND_REQUEST_DECLINED", `${data.dmchannel.user1.id === data.user.id ? data.dmchannel.user2.login : data.dmchannel.user1.login} decline your friend request`)
		})
		
		socket?.on("friendHasBeenRemoved", () => {
			if (username === "")
				getUsers();
			else
				searchUsers();
		})

		getUsers();
	}, [socket])


	useEffect(() => {
		let timeout: any;

		if (username !== ""){
			setTyping(true)
			setSearchResult([])
			timeout = setTimeout(async () => {
				searchUsers()
				setTyping(false)
			}, 1000);
		}

		return () => clearTimeout(timeout)
	}, [username])

    return (
		<div className="containerPublic">
      		<div className="childPublic" style={{ backgroundColor: color.primary }}>
        		<div className="containerTitle">
          			<div className="childContainerTitle">
            			<p>Public</p>
          			</div>
        		</div>
      			<div className="categoryPublic">
					<Link to={`/public/players`} style={{ borderBottom: "2px solid white" }} className="pCategoryPublic">Players</Link>
					<Link to={`/public/channels`} style={{ borderBottom: "none" }} className="pCategoryPublic" >Channels</Link>
				</div>
        		<div className="containerSearchBar">
          			<input type="text" placeholder="Rechercher..." className="searchBarPublic" onChange={(e) => setUsername(e.currentTarget.value)} />
				</div>
	  			<div className="containerScroll">
					{!loading && users.length === 0 && <div className="noPlayers">No user available</div>}
					{!loading && !typing && username !== "" && searchResult.length === 0 && <div className="noPlayers">No user found</div>}
					{typing && !loading && <Loader />}
					{loading ? 
						<Loader /> : 
						(username !== "" ?
							searchResult.map((user: User, index: number) => (
								<UserPComponent user={user} status={usersStatus.find(e => e.userId === user.id)?.status} key={index}/>
							)) :
							users.map((user: User, index: number) => (
								<UserPComponent user={user} status={usersStatus.find(e => e.userId === user.id)?.status} key={index}/>
							))
						)
					}
				</div>
      		</div>
    	</div>
    )
}