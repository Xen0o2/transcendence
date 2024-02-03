import "./MessageComponent.css";
import { User } from "../Chat";
import Cookies from "js-cookie";

export default function MessageComponent({ content, sender, displayLogin}: { content: string, sender: User | null, displayLogin: boolean }) {

  return (
    <>
        <div className="containerBubble">
			{!sender && 
				<>
					<div className="containerTextNameBubble">
						{displayLogin && <p className="nameBubble">{Cookies.get("login")}</p>}
						<div className="textBubble" style={{ backgroundColor: "#009688", opacity: "0.8"}}>
							<p className="text">{content}</p>
						</div>
					</div>
					{displayLogin ?
						<div className="containerImgBubble">
							<img alt={"imgBubble"} src={Cookies.get("image")} className="imgBubble"></img>
						</div> :
						<div className="containerImgBubble">salut</div>
						}
				</>
			}
			{sender && sender.id === Cookies.get("id") ? 
			<>
				<div className="containerTextNameBubble">
					{displayLogin && <p className="nameBubble">{sender.login}</p>}
					<div className="textBubble" style={{ backgroundColor: "#009688" }}>
						<p className="text">{content}</p>
					</div>
				</div>
				{displayLogin ?
					<div className="containerImgBubble">
						<img alt={"imgBubble"} src={sender.image} className="imgBubble"></img>
					</div> :
					<div className="containerImgBubble">salut</div>
					}
			</> : (sender && 
				<>
					{displayLogin ?
						<div className="containerImgBubble">
							<img src={sender.image} alt={"imgBubble"} className="imgBubble"></img>
						</div> :
						<div className="containerImgBubble"></div>
						}
					<div className="containerTextNameBubble" style={{alignItems:"flex-start"}}>
					{displayLogin && <p className="nameBubble">{sender.login}</p>}
					<div className="textBubble" style={{ backgroundColor: "#4A4A4A" }}>
						<p className="text">{content}</p>
					</div>
					</div>
				</>
			)
		}
        </div>
    </>
  );
}
