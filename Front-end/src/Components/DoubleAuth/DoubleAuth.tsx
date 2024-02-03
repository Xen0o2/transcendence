import React, { ChangeEvent, useState, useRef, KeyboardEvent } from "react";
import "./DoubleAuth.css";
import { color } from "../../config";

import QrCode from "../../assets/qrCode.png";

export default function DoubleAuth() {
  const [valueNum, setValueNum] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handleInput = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    if (e.target.value.length === 1) {
      const newValue = e.target.value.charAt(0);
      const newArray = [...valueNum];
      newArray[index] = newValue;
      setValueNum(newArray);

      if (index < inputRefs.length - 1) {
        inputRefs[index + 1].current?.focus();
      }
    } else if (e.target.value.length === 0) {
      const newArray = [...valueNum];
      newArray[index] = "";
      setValueNum(newArray);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      const newArray = [...valueNum];
  
      if (index > 0 && index < 5) {
        if (newArray[index] === "") {
          newArray[index - 1] = "";
          inputRefs[index - 1].current?.focus();
        } else {
          newArray[index] = "";
        }
      } else if (index === 0) {
        newArray[index] = "";
      } else if (index === 5) {
        if (newArray[index] !== ""){
          newArray[index] = "";
        } else if (newArray[index] === ""){
          newArray[index - 1] = "";
          inputRefs[index - 1].current?.focus();
        }
            
      }
  
      setValueNum(newArray);
    }
  };

  return (
    <div className="containerDoubleAuth">
      <div className="childDoubleAuth" style={{ backgroundColor: color.primary }}>
        <div className="title">
          <p>Two factor auth setup</p>
        </div>
        <img src={QrCode} className="qrCodeImg" alt="QR Code" />
        <div className="number2fa">
          {inputRefs.map((ref, index) => (
            <input
              key={index}
              value={valueNum[index]}
              onChange={(e) => handleInput(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="inputNumber"
              maxLength={1}
              ref={ref}
            />
          ))}
        </div>

        <button className="button2fa">Change</button>
      </div>
    </div>
  );
}
