import React, { useEffect, useRef } from "react";
import axios from "axios";

const FaceCheck = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const initCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      setInterval(async () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        const frame = canvas.toDataURL("image/jpeg");

        // Send frame to backend
        try {
          const res = await axios.post("http://localhost:5001/process-frame", {
            frame,
          });
          console.log(res.data);
        } catch (err) {
          console.error("Error sending frame:", err);
        }
      }, 2000); // send every 2 sec
    };

    initCamera();
  }, []);

  return <video ref={videoRef} autoPlay muted width="400" />;
};

export default FaceCheck;
