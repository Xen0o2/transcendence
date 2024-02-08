import { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import io from 'socket.io-client';

import "./App.css";

// Components

import Header from "./Components/Header/Header";
import Login from "./Components/Login/Login";
import Game from "./Components/Game/Game";
import Pseudo from "./Components/Pseudo/Pseudo";
import About from "./Components/About/About";
import DoubleAuth from "./Components/DoubleAuth/DoubleAuth";
import TwoFactorAuth from "./Components/Login/TwoFactorAuth";


import ProfileComponent from "./Components/Profile/ProfileComponent/ProfileComponent";
import HistoryComponent from "./Components/Profile/HistoryComponent/HistoryComponent";
import FriendComponent from "./Components/Profile/FriendComponent/FriendComponent";
import Players from "./Components/Public/Players/Players";
import Channels from "./Components/Public/Channels/Channels";

import { SocketProvider } from './ContextSocket';
import { NotificationProvider, useNotification } from "./ContextNotification";

import { address } from "./config";
import { User } from "./Components/Chat/Chat";

export const API_BASE_URL = address.backendURL + ":" + address.backendPort
export const REDIRECT_URI = address.frontendRedirectURL + ":" + address.frontendPort

const PseudoComponent = () => (
  <>
    <Header />
    <Pseudo />
  </>
);

const GameComponent = () => (
  <>
    <Header />
    <Game />
  </>
);

const AboutComponent = () => (
  <>
    <Header />
    <About />
  </>
);

const DoubleAuthComponent = () => (
  <>
    <Header />
    <DoubleAuth />
  </>
);

const ProfileWithHeaderComponent = () => (
  <>
    <Header />
    <ProfileComponent />
  </>
);

const HistoryWithHeaderComponent = () => (
  <>
    <Header />
    <HistoryComponent />
  </>
);

const FriendsWithHeaderComponent = () => (
  <>
    <Header />
    <FriendComponent />
  </>
);

const PlayersComponent = () => (
  <>
    <Header />
    <Players />
  </>
);

const ChannelsComponent = () => (
  <>
    <Header />
    <Channels />
  </>
);


function App() {
  let [socketState, setSocketState] = useState<any>(null);
  let [errored, setErrored] = useState(false);
  let [loading, setLoading] = useState(false);
  let [id, setId] = useState(Cookies.get("id"))
  let [name, setName] = useState(Cookies.get("login"))
  let [user, setUser] = useState<User>();
  let [update, setUpdate] = useState(false);

  let code = new URLSearchParams(window.location.search).get("code");

  useEffect(() => {
    
    if (name && Cookies.get("2fa")) {
      const socket = io(address.socketURL + ":" + address.socketPort, {
        withCredentials: true, 
        transports: ['websocket'],
        query: { id: id, login: name }
      });

      socket.on('connect', () => {
        console.log('Connected to server');
      });
      setSocketState(socket);
    }
    
  },[name, id, user]);

  	useEffect(() => {
    	const getToken = async () => {
      		setLoading(true);
      		try {
              let response = await axios.post(`${API_BASE_URL}/user/login/${code}`);
              setUser(response.data);
              setId(response.data.id);
              setName(response.data.login);
              Cookies.set("id", response.data.id);
              Cookies.set("login", response.data.login)
              Cookies.set("firstname", response.data.firstname)
              Cookies.set("lastname", response.data.lastname)
              Cookies.set("image", response.data.image)
              if (!response.data.mail)
                Cookies.set("2fa", "OK");
              setErrored(false);
              setLoading(false);
        } catch(e) {
          console.log(e);
          setErrored(true);
        }
		};

    if (code && !Cookies.get("id"))
      getToken();
  }, [code]);

  useEffect(() => {
    const getUser = async () => {
      if (!Cookies.get("id")) return;
      try {
        let response = await axios.get(`${API_BASE_URL}/user/${Cookies.get("id")}`)
        setUser(response.data)
        if (!response.data.mail) 
          Cookies.set("2fa", "OK")
        if (!response.data && Cookies.get("id")) {
          Cookies.remove("id")
          Cookies.remove("login")
          Cookies.remove("image")
          Cookies.remove("firstname")
          Cookies.remove("lastname")
        }
      } catch(error) {
        console.error(error)
      }
    }

    getUser();
  }, [])

    return (
      <SocketProvider socket={socketState}>
      <NotificationProvider >
      <Router>
        {(Cookies.get("id") && Cookies.get("2fa")) ?
          <Routes>
            <Route path="/login" element={<GameComponent />} />
            <Route path="/" element={<GameComponent />} />
            <Route path="/game" element={<GameComponent />} />
            <Route path="/username" element={<PseudoComponent />} />
            <Route path="/profile">
              <Route path=":userId/profile" element={<ProfileWithHeaderComponent />} />
              <Route path=":userId/history" element={<HistoryWithHeaderComponent />} />
              <Route path=":userId/friends" element={<FriendsWithHeaderComponent />} />
            </Route>
            <Route path="/public">
              <Route path="players" element={<PlayersComponent />} />
              <Route path="channels" element={<ChannelsComponent />} />
            </Route>
            <Route path="/about" element={<AboutComponent />} />
            <Route path="/2fa"  element={<DoubleAuthComponent />} />
          </Routes> :
          (Cookies.get("id") && !Cookies.get("2fa") && !errored && user && user.mail) ?
            <TwoFactorAuth user={user} setUpdate={setUpdate} /> :
            <Login error={errored} loading={loading} />
        
        }
      </Router>
      </NotificationProvider>
      </SocketProvider>
    );
}

export default App;
