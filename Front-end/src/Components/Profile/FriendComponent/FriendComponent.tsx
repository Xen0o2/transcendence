import { Dispatch, SetStateAction, useEffect, useState } from "react";
import "./FriendComponent.css";
import { DMChannel, Friendship, FriendshipStatus, User } from "../../Chat/Chat";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../../App";
import Loader from "../../Loader/Loader";
import { color } from "../../../config";
import Cookies from "js-cookie";
import { useSocket } from "../../../ContextSocket";
import { useNotification } from "../../../ContextNotification";

export default function FriendComponent() {
	
	const { userId } = useParams();
	const socket = useSocket();
	const showNotification = useNotification();

	const [categoryFriend, setCategoryFriend] = useState(0);
	const [loadingUnblock, setLoadingUnblock] = useState(false)
	const [loadingAccept, setLoadingAccept] = useState<number[]>([])
	const [loadingDecline, setLoadingDecline] = useState<number[]>([])
	const [loadingRemove, setLoadingRemove] = useState<string[]>([])
	
	const [user, setUser] = useState<User>();
	const [usersStatus, setUsersStatus] = useState<{userId: string, status: number}[]>([])

	const getUser = async() => {
		try {
			let response = await axios.get(`${API_BASE_URL}/user/${userId}`)
			setUser(response.data)
		} catch(error) {
			console.error(error)
			showNotification("ERROR_LOADING", "An error occured while loading")
		}
	}

	useEffect(() => {
		getUser()
	}, [userId])

	const unblock = async (deblockUserId: string) => {
		setLoadingUnblock(true)
		try {
			let response = await axios.post(`${API_BASE_URL}/user/deblock/${userId}/${deblockUserId}`)

			socket?.emit("unblockUser", { blockerId: userId, blockedId: deblockUserId })

			setUser(response.data)
			setLoadingUnblock(false)
		} catch(error) {
			setLoadingUnblock(false)
			console.error(error)
			showNotification("ERROR_UNBLOCK_USER", "An error occured while unblocking a user")
		}
	}

	const acceptFriendRequest = async (friendshipId: number) => {
		setLoadingAccept(old => [...old, friendshipId])
		try {
			let response = await axios.post(`${API_BASE_URL}/friendship/accept/${friendshipId}`)

			socket?.emit("acceptFriendRequest", { userId: response.data.user1id === Cookies.get("id") ? response.data.user2id : response.data.user1id })

			getUser();
			setLoadingAccept(old => old.filter(e => e != friendshipId))
		} catch (e) {
			setLoadingAccept(old => old.filter(e => e != friendshipId))
			console.error(e)
			showNotification("ERROR_ACCEPT_FRIEND_REQUEST", "An error occured while accepting friend request")
		}
	}

	const declineFriendRequest = async (friendshipId: number) => {
		setLoadingDecline(old => [...old, friendshipId])
		try {
			let response = await axios.post(`${API_BASE_URL}/friendship/decline/${friendshipId}`)

			socket?.emit("declineFriendRequest", { userId: response.data.user1id === Cookies.get("id") ? response.data.user2id : response.data.user1id })

			getUser();
			setLoadingDecline(old => old.filter(e => e != friendshipId))
		} catch (e) {
			setLoadingDecline(old => old.filter(e => e != friendshipId))
			console.error(e)
			showNotification("ERROR_DECLINE_FRIEND_REQUEST", "An error occured while declining friend request")
		}
	}

	const removeFriend = async (removeUserId: string) => {
		setLoadingRemove(old => [...old, removeUserId])
		try {
			let response = await axios.delete(`${API_BASE_URL}/user/${userId}/removeFriend/${removeUserId}`)

			socket?.emit("removeFriend", { userId: removeUserId })

			setUser(response.data)
			setLoadingRemove(old => old.filter(e => e !== removeUserId))
		} catch(error) {
			setLoadingRemove(old => old.filter(e => e !== removeUserId))
			console.error(error)
			showNotification("ERROR_REMOVE_FRIEND", "An error occured while removing the friend")
		}
	}

	useEffect(() => {
		try {
		socket?.emit("getUsersStatus")

		socket?.on("usersStatus", (data: { userId: string, status: number }[]) => {
			setUsersStatus(data);
		})

		socket?.on("friendHasBeenRemoved", (data: { user: User }) => {
			setUser(data.user)
		})

		socket?.on("receiveFriendRequest", (data: { friendship: Friendship, user: User }) => {
			setUser(data.user);
			showNotification("RECEIVE_FRIEND_REQUEST", `${data.friendship.user1id === data.user.id ? data.friendship.user2?.login : data.friendship.user1?.login} sent you a friend request`)
		})

		socket?.on("friendRequestAccepted", (data: { dmchannel: DMChannel, user: User}) => {
			setUser(data.user);
			showNotification("FRIEND_REQUEST_ACCEPTED", `${data.dmchannel.user1?.id === data.user.id ? data.dmchannel.user2?.login : data.dmchannel.user1?.login} accept your friend request`)
		})
		
		socket?.on("friendRequestDeclined", (data: { dmchannel: DMChannel, user: User}) => {
			setUser(data.user);
			showNotification("ERROR_FRIEND_REQUEST_DECLINED", `${data.dmchannel.user1?.id === data.user.id ? data.dmchannel.user2?.login : data.dmchannel.user1?.login} decline your friend request`)
		})

		socket?.on("hasBeenBlocked", (data: { dmchannel: DMChannel, user: User }) => {
			setUser(data.user)
			showNotification("ERROR_HAS_BEEN_BLOCKED", `${data.dmchannel.user1?.id === data.user.id ? data.dmchannel.user2?.login : data.dmchannel.user1?.login} has blocked you`)
		})
		
		socket?.on("hasBeenUnblocked", (data: { dmchannel: DMChannel, user: User }) => {
			setUser(data.user)
			showNotification("HAS_BEEN_UNBLOCKED", `${data.dmchannel.user1?.id === data.user.id ? data.dmchannel.user2?.login : data.dmchannel.user1?.login} has unblocked you`)
		})
	}
	catch (e) {}

	}, [socket])

	return (
		<div className="containerProfil">
			<div className="childProfil" style={{ backgroundColor: color.primary }}>
				<div className="menuProfil">
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/profile`}>Profile</Link>
					</div>
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/history`}>History</Link>
					</div>
					{userId === Cookies.get("id") && 
					<div className="categoryProfil">
						<Link className="textCategoryProfil" to={`/profile/${userId}/friends`}>Friends</Link>
						<div className="borderBottomProfil"></div>
					</div>}
				</div>
				<div id="friendsContent">
					<div className="categoryFriends">
						<p onClick={() => setCategoryFriend(0)} style={{ borderBottom: categoryFriend === 0 ? "2px solid white" : "none" }} className="pCategoryFriend">Friends</p>
						<p onClick={() => setCategoryFriend(1)} style={{ borderBottom: categoryFriend === 1 ? "2px solid white" : "none" }} className="pCategoryFriend">Pending</p>
						<p onClick={() => setCategoryFriend(2)} style={{ borderBottom: categoryFriend === 2 ? "2px solid white" : "none" }} className="pCategoryFriend">Blocked</p>
					</div>
					{/*AMIS DE L'UTILISATEUR*/}
					{!user && <div style={{padding: "240px"}}><Loader /></div>}
					{user && 
						<>
						{categoryFriend === 0 && user.friends.length === 0 && <div className="addFriendContainer"><Link to="/public/players" className="addFriendButton">Add new friends</Link></div>}
						{categoryFriend === 0 &&
							user.friends.map((friend, index) => (
								<div className="containerFriends" key={index}>
									<div className="contentFriends">
									<div className="circleOnline" style={{backgroundColor: usersStatus.find(e => e.userId === friend.id)?.status === undefined ? "#FF5A5A" : "green"}}></div>
									<div className="friendsPicture">
										<img alt="friendImg" className="friendsImg" src={friend.image} />
									</div>
									<div className="friendsInfos">
										<p className="infosP">{friend.login}</p>
										{/* <p className="infosP">{friend.status}</p> */}
										{/* <p className="infosP">{friend.rank}</p> */}
										{/* <p className="infosP">{friend.games}</p> */}
									</div>
									<div className="containerButton">
										<Link to={`/profile/${friend.id}/profile`} className="friendsHistory">Profile</Link>
										{/* <button className="friendsButton"> Join </button> */}
										{loadingRemove.includes(friend.id) ? 
											<button className="friendsRemove" disabled><Loader /></button> :
											<button className="friendsRemove" onClick={() => {removeFriend(friend.id)}}>Remove</button>
										}
										{/* <p className="friendsButton"> Block </p> */}
									</div>
									</div>
								</div>
							))
						}
						{/*DEMANDE D'AMI EN ATTENTE*/}
						{categoryFriend === 1 && 
							user.friendship2?.filter(friendship => friendship.status === FriendshipStatus.PENDING).length === 0 && 
							user.friendship1?.filter(friendship => friendship.status === FriendshipStatus.PENDING).length === 0 && 
							<div className="addFriendContainer" style={{color: "white"}}>No pending request</div>}
						{categoryFriend === 1 &&
							<>
							{user.friendship2?.filter(friendship => friendship.status === FriendshipStatus.PENDING).map((friendship, index) => (
								<div className="containerFriends" key={index}>
									<div className="contentFriends">
									<div className="circleOnline" style={{backgroundColor: usersStatus.find(e => e.userId === friendship.user1.id)?.status === undefined ? "#FF5A5A" : "green"}}></div>
									<div className="friendsPicture">
										<img alt="friendImg" className="friendsImg" src={friendship.user1.image} />
									</div>
									<div className="friendsInfos">
										<p className="infosP">{friendship.user1.login}</p>
									</div>
									<div className="containerButton">
										{loadingAccept.includes(friendship.id) ? 
											<button className="friendsAcceptButton" disabled><Loader /></button> :
											<button className="friendsAcceptButton" onClick={() => {acceptFriendRequest(friendship.id)}}>Accept</button>}
										{loadingDecline.includes(friendship.id) ? 
											<button className="friendsDeclineButton" disabled><Loader /></button> :
											<button className="friendsDeclineButton" onClick={() => {declineFriendRequest(friendship.id)}}>Decline</button>}
									</div>
									</div>
								</div>
							))}
							{user.friendship1?.filter(friendship => friendship.status === FriendshipStatus.PENDING).map((friendship, index) => (
								<div className="containerFriends" key={index}>
									<div className="contentFriends">
									<div className="circleOnline" style={{backgroundColor: usersStatus.find(e => e.userId === friendship.user2.id)?.status === undefined ? "#FF5A5A" : "green"}}></div>
									<div className="friendsPicture">
										<img alt="friendImg" className="friendsImg" src={friendship.user2.image} />
									</div>
									<div className="friendsInfos">
										<p className="infosP">{friendship.user2.login}</p>
									</div>
									<div className="containerButton">
										<button className="friendsWaitingButton" disabled>Pending...</button>
									</div>
									</div>
								</div>
							))}
							</>	
						}
						{categoryFriend === 2 && 
							user.blockedUsers.length === 0 &&
							user.blockedBy.length === 0 && 
							<div className="addFriendContainer" style={{color: "white"}}>No users blocked</div>}
						{categoryFriend === 2 && 
							<>
							{user.blockedUsers.map((user, index) => (
								<div className="containerFriends" key={index}>
									<div className="contentFriends">
									<div className="circleOnline" style={{backgroundColor: usersStatus.find(e => e.userId === user.id)?.status === undefined ? "#FF5A5A" : "green"}}></div>
									<div className="friendsPicture">
										<img alt="friendImg" className="friendsImg" src={user.image} />
									</div>
									<div className="friendsInfos">
										<p className="infosP">{user.login}</p>
									</div>
									<div className="containerButton">
										{loadingUnblock ?
											<Loader /> : 
											<button className="friendsUnblockButton" onClick={() => unblock(user.id)}>Unblock</button>
										}
									</div>
									</div>
								</div>
							))}
							{user.blockedBy.map((user, index) => (
								<div className="containerFriends" key={index}>
									<div className="contentFriends">
									<div className="circleOnline" style={{backgroundColor: usersStatus.find(e => e.userId === user.id)?.status === undefined ? "#FF5A5A" : "green"}}></div>
									<div className="friendsPicture">
										<img alt="friendImg" className="friendsImg" src={user.image} />
									</div>
									<div className="friendsInfos">
										<p className="infosP">{user.login}</p>
									</div>
									<div className="containerButton">
										<p className="friendsWaitingButton">Has blocked you</p>
									</div>
									</div>
								</div>
							))}
							</>
						}
						</>
						}
				</div>
			</div>
		</div>
	)
}
