import { useState, useCallback, useEffect } from "react";
import axios from 'axios';
import "./Pseudo.css";
import { useNavigate } from "react-router-dom";
import { IoMdDownload } from "react-icons/io";
import { useDropzone } from "react-dropzone";
import { FaPencil } from "react-icons/fa6";

import { color } from "../../config";
import { API_BASE_URL } from "../../App";
import Cookies from "js-cookie";
import { useNotification } from "../../ContextNotification";
import Loader from "../Loader/Loader";

export default function Pseudo() {
  
  const showNofitication = useNotification();
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [username, setUsername] = useState("");
  const [validate, setValidate] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const handleStop = () => {
    navigate("/game");
  };

  const handleValidate = async () => {

    setLoadingSave(true)
    const forbiddenCharacters = new RegExp(`[ /]`);
    if (forbiddenCharacters.test(username))
      return showNofitication("ERROR_PROFILE_UPDATE", "Special characters are forbidden")
    
    try {
      if (username === "" && uploadedFiles.length === 0) return setLoadingSave(false)
      let response = await axios.post(`${API_BASE_URL}/user/${Cookies.get("id")}/username`, { username: (username === "" ? Cookies.get("login") : username.slice(0, 8)) })    
      const extensions = ["jpg", "jpeg", "png", "webp", "gif"]
      if (uploadedFiles[0] && !extensions.some(extension => uploadedFiles[0].name.toLowerCase().endsWith(extension))) {
        setLoadingSave(false);
        return showNofitication("ERROR_UPLOAD_NOT_IMAGE", "You can only upload images")
      }
      if (response.data && !response.data.error) {
        showNofitication("PROFILE_UPDATE", "Profile successfully updated")
        Cookies.set("login", username)
      } else if (!response.data)
        showNofitication("ERROR_PROFILE_UPDATE", "This username already exists")
      setLoadingSave(false)
    } catch(error) {
      setLoadingSave(false)
      console.error(error)
      showNofitication("ERROR_PROFILE_UPDATE", "An error occurred while updating your profile")
    }
    
    // UPLOAD LA NOUVELLE PHOTO DE PROFIL
    setValidate(true);
    setTimeout(() => {
      navigate("/game");
    }, 1000)
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles);
    if (acceptedFiles.length > 0) {
      setUploadedFiles([acceptedFiles[0]]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleUpload = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('file', uploadedFiles[0]);
      
      let response = await axios.post(`${API_BASE_URL}/images/upload/${Cookies.get("id")}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', }
      })
      Cookies.set("image", `${API_BASE_URL}/images/${response.data}`)
      showNofitication("PROFILE_UPDATE", "Profile ssuccessfully updated")
    } catch (error) {
      console.error('Error uploading file', error);
      showNofitication("ERROR_UPLOADING_IMAGE", "An error occured while uploading image")
    }
  }, [uploadedFiles]);

  const uploadHandler = useCallback(() => {
    if (!validate || !uploadedFiles[0]) return
    handleUpload();
  }, [uploadedFiles, validate, handleUpload]);

  useEffect(() => {
    uploadHandler();  
  }, [uploadHandler]);



  return (
    <div className="containerPseudo">
      <div
        className="containerPseudoChild"
        style={{ backgroundColor: color.primary }}
      >
        <div className="title">
          <p>Change your things here</p>
        </div>
        <input maxLength={8} value={username} onChange={(e) => setUsername(e.currentTarget.value)} placeholder="New username" className="inputPseudo" style={{ backgroundColor: color.primary }} />

        <div className="containerUpload">
          {uploadedFiles.length === 0 && (
            <button {...getRootProps()} className="upload">
              <IoMdDownload /> <input {...getInputProps()} accept="image/*" />
              Upload avatar
            </button>
          )}

          {/* Afficher l'image téléchargée (s'il y en a une) */}
          {uploadedFiles.length > 0 && (
            <div className="containerImgUpload" {...getRootProps()}>
              <FaPencil className="penUpload" />
              <img
                src={URL.createObjectURL(uploadedFiles[0])}
                alt={`Uploaded ${uploadedFiles[0].name}`}
                className="imgUpload"
              />
            </div>
          )}
        </div>

        <div className="containerValid">
          {loadingSave ? 
            <button className="validButton"><Loader /></button> :
            <button onClick={handleValidate} className="validButton">Save</button>
          }
          <button onClick={handleStop} id="cancelButton" className="validButton">Cancel</button>
        </div>
      </div>
    </div>
  );
}


