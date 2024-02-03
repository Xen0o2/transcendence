import React from "react";
import "./About.css";
import { color } from "../../config";
import gcherqui from "../../assets/gcherqui.jpg";
import moubaza from "../../assets/mbouaza.jpg";
import tunsinge from "../../assets/tunsinge.jpg";
import alecoutr from "../../assets/alecoutr.jpg";
import dustin from "../../assets/dustin.png";

export default function About() {
  return (
    <div className="containerAbout">
      <div className="childAbout" style={{ backgroundColor: color.primary }}>
        <p className="titleAbout">About us</p>
        <div className="containerText">
          <p style={{ marginTop: "10px" }}>
            Transcendence is the final project of the common core curriculum at
            42, carried out by our team consisting of Tunsinge, Alecoutr,
            Mbouaza, and Gcherqui. We utilized React JS and Typescript for the
            front-end, while the back-end was developed using NestJS with
            Typescript. Gcherqui handled the front-end development, Alecoutr
            managed the back-end, Mbouaza created the Pong game, and Tunsinge
            oversaw the Docker architecture implementation as well as the
            database setup.
          </p>
        </div>
        <div className="containerImage">
          <img alt="imgcreator" className="img" src={gcherqui}></img>
          <img alt="imgcreator" className="img" src={moubaza}></img>
          <img alt="imgcreator" className="img" src={tunsinge}></img>
          <img alt="imgcreator" className="img" src={alecoutr}></img>
        </div>
      </div>
    </div>
  );
}
