import { useEffect, useState } from "react";
import "./UserPComponent.css";
import { Friendship, FriendshipStatus, User } from "../../../Chat/Chat";
import axios from "axios";
import { API_BASE_URL } from "../../../../App";
import Cookies from "js-cookie";
import Loader from "../../../Loader/Loader";
import { useSocket } from "../../../../ContextSocket";
import { useNotification } from "../../../../ContextNotification";

export default function UserPComponent({user, status}: {user: User, status: number | undefined}) {

	const socket = useSocket()
	const showNotification = useNotification();

	const [friendships, setFriendships] = useState<Friendship[]>([])
	const [loadingSend, setLoadingSend] = useState(false)
	const [loadingAccept, setLoadingAccept] = useState(false)
	
	const statusString = [
		"Online",
		"Playing"
	]

  	const sendFriendRequest = async (user: User) => {
		setLoadingSend(true)
		try {
			let response = await axios.put(`${API_BASE_URL}/friendship/create`, {
				prisma: {
					user1id: Cookies.get("id"),
					user2id: user.id,
					status: "PENDING"
				}
			});

			if (response.data) {
				socket?.emit("sendFriendRequest", { friendship: response.data, userId: user.id })
				setFriendships(oldFriendships => {
					return [...oldFriendships, response.data]
				})
			}
			setLoadingSend(false)
		} catch(e) {
			setLoadingSend(false)
			console.error(e)
			showNotification("ERROR_SEND_FRIEND_REQUEST", "An error occured while sending friend request")
		}
  	}

	const acceptFriendRequest = async (friendshipId: number) => {
		setLoadingAccept(true)
		try {
			await axios.post(`${API_BASE_URL}/friendship/accept/${friendshipId}`)

			
			const editFriendships = [...friendships]
			const index = editFriendships.findIndex((friendship: Friendship) => friendship.id === friendshipId)
			editFriendships[index].status = FriendshipStatus.ACCEPTED
			socket?.emit("acceptFriendRequest", { userId: editFriendships[index].user1id === Cookies.get("id") ? editFriendships[index].user2id : editFriendships[index].user1id })
			setFriendships(editFriendships)
			setLoadingAccept(false)
		} catch (e) {
			setLoadingAccept(false)
			console.error(e)
			showNotification("ERROR_LEAVING_CHANNEL", "An error occured while accepting friend request");
		}
	}

	useEffect(() => {
		if (user.friendship1 && user.friendship2)
			setFriendships([
				...user.friendship1.filter((friendship: Friendship) => friendship.user1id === Cookies.get("id") || friendship.user2id === Cookies.get("id")),
				...user.friendship2.filter((friendship: Friendship) => friendship.user1id === Cookies.get("id") || friendship.user2id === Cookies.get("id"))
			])

	}, [user])
  return (
    <div className="containerUserP">
      <div className="userPublic">
        <div className="containerLeft">
          <div
            className="circleOnline"
            style={{ backgroundColor: status === undefined ? "#FF5A5A" : "green" }}
          ></div>
          <img alt="imageUser" className="imgUserP" src={user.image}></img>
          <div className="infoUserP">
            <div className="leftInfos">
              <p>{user.login}</p>
            </div>
            <div className="rightInfos">
              <p className="playingP">{status === undefined ? "Offline" : statusString[status]}</p>
            </div>
          </div>
        </div>
			{friendships.find((friendship: Friendship) => {
				return friendship.user1id === user.id && friendship.status === FriendshipStatus.PENDING
			}) && (loadingAccept ? 
					<button className="buttonAccept" disabled><Loader /></button> :
					<button className="buttonAccept" onClick={() => {acceptFriendRequest(friendships.find((friendship: Friendship) => { return friendship.user1id === user.id })!.id)}}>Accept</button>)}
			
			{friendships.find((friendship: Friendship) => {
				return friendship.user2id === user.id && friendship.status === FriendshipStatus.PENDING
			}) && <button className="buttonWaiting">Pending...</button>}
			
			{((user.blockedUsers.find(u => u.id === Cookies.get("id")) || user.blockedBy.find(u => u.id === Cookies.get("id"))) ?
				<button className="buttonBlock" disabled>Blocked</button> :
				(!friendships.find((friendship: Friendship) => {
					return (friendship.user2id === user.id || friendship.user1id === user.id)
				}) ? 
				(loadingSend ? 
					<button className="buttonAdd" disabled><Loader /></button> : 
					<button className="buttonAdd" onClick={() => {sendFriendRequest(user)}}>Add +</button>) :
					null
				)
			)}

			{friendships.find((friendship: Friendship) => {
					return (friendship.user2id === user.id || friendship.user1id === user.id) && friendship.status === FriendshipStatus.ACCEPTED
				}) && <button className="buttonFriend" disabled>Friend</button>}
      </div>
    </div>
  );
}
