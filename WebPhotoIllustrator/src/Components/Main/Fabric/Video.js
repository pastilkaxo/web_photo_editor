import React,{useState,useRef} from "react"

import { IconButton, Button } from "blocksin-system";
import { FabricImage } from "fabric";
import {VideoCameraIcon,StopIcon,PlayIcon} from "sebikostudio-icons"

function Video({ canvas, canvasRef }) {
  const [videoSrc, setVideoSrc] = useState(null);
  const [fabricVideo, setFabricVideo] = useState(null);
  const [recordingChunks, setRecordingChunks] = useState([])
  const [isRecording, setIsRecording] = useState(false);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideoMenu, setShowVideoMenu] = useState(false); 
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null)
  const recordingIntervalRef = useRef(null);
  
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setVideoSrc(null)
      setLoadPercentage(0)
      setUploadMessage("")
      const url = URL.createObjectURL(file);
      setVideoSrc(url);

      const videoElement = document.createElement("video");
      videoElement.src = url
      videoElement.crossOrigin = "anonymous";

      videoElement.addEventListener("loadeddata", () => {
        const videoWidth = videoElement.videoWidth
        const videoHeight = videoElement.videoHeight;
        videoElement.width = videoWidth;
        videoElement.height = videoHeight;

        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const scale = Math.min(
          canvasWidth / videoWidth,
          canvasHeight / videoHeight
        );
        canvas.renderAll();

        const fabricImage = new FabricImage(videoElement, {
          left: 0,
          top: 0,
          scaleX: scale,
          scaleY: scale
        })
        setFabricVideo(fabricImage);
        canvas.add(fabricImage);
        canvas.renderAll();

        setUploadMessage("Загружено");
        setTimeout(() => { setUploadMessage("") }, 3000)
      });
            
      videoElement.addEventListener("progress", () => {
        if (videoElement.buffered.length > 0) {
          const bufferedEnd = videoElement.buffered.end(
            videoElement.buffered.length - 1
          );
          const duration = videoElement.duration;
          if (duration > 0) {
            setLoadPercentage((bufferedEnd / duration) * 100);
          }
        }
      })

      videoElement.addEventListener("error", (error) => {
        console.error(error);
      })

      videoRef.current = videoElement;
    }
    setShowVideoMenu(false); // закрываем меню после загрузки
  }

  const handlePlayPauseVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
        videoRef.current.addEventListener("timeupdate", () => {
          fabricVideo.setElement(videoRef.current);
          canvas.renderAll();
        })
      }
      else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }

  const handleStopVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      canvas.renderAll();
    }
  }

  const handleVideoUploadButtonClick = () => {
    fileInputRef.current.click();
  }

  // recording
  
  const handleStartRecording = () => {
    const stream = canvasRef.current.captureStream();
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm; codecs=vp9",
    });

    const chunks = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      setRecordingChunks(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zapis-holsta.webm";
      a.click();
      URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    clearInterval(recordingIntervalRef.current);
  };

  const handleDataAvailiable = (event) => {
    if (event.data.size > 0) {
      setRecordingChunks((prev) => [...prev, event.data]);
    }
  }

  const handleExportVideo = () => {
    const blob = new Blob(recordingChunks, {
      type: "video/webm",
    })
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "video-holsta.webm";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    setRecordingChunks([])
  }

  const toggleVideoMenu = () => {
    setShowVideoMenu(!showVideoMenu);
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type='file'
        style={{ display: "none" }}
        accept='video/mp4'
        onChange={handleVideoUpload}
      />
      <div className="video-container">
        <IconButton
          onClick={toggleVideoMenu}
          variant="ghost"
          size="medium"
        >
          <VideoCameraIcon/>
        </IconButton>

        {showVideoMenu && (
          <div className='video-menu'>
            <div className="video-menu-section">
              <h3>Видео на холст</h3>
              <Button
                onClick={handleVideoUploadButtonClick}
                variant="primary"
                size="medium"
                fullWidth
              >
                Выбрать файл (MP4)
              </Button>
            </div>

            {videoSrc && (
              <div className="video-menu-section">
                <h3>Воспроизведение</h3>
                <div className='video-controls-playback'>
                  <Button
                    onClick={handlePlayPauseVideo}
                    variant="secondary"
                    size="medium"
                  >
                    {isPlaying ? "Пауза" : "Играть"}
                  </Button>
                  <Button
                    onClick={handleStopVideo}
                    variant="secondary"
                    size="medium"
                  >
                    Стоп
                  </Button>
                </div>
                
                <div className="video-controls-progress">
                  <div className="progress-label">Буферизация</div>
                  <div className="video-progress-bar">
                    <div className="video-progress-fill" style={{width:`${loadPercentage}%`}}></div>
                    {uploadMessage && (
                      <div className="video-upload-message">
                        {uploadMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="video-menu-section">
              <h3>Запись экрана</h3>
              <div className="video-controls-recording">
                <Button 
                  onClick={isRecording ? handleStopRecording : handleStartRecording}
                  variant={isRecording ? "danger" : "secondary"}
                  size="medium"
                  showBadge={isRecording}
                  badgeLabel={new Date(recordingTime * 1000).toISOString().substr(11, 8)}
                >
                  {isRecording ? 
                    <>
                      <StopIcon/> Остановить запись
                    </>  
                    :
                    <>
                      <PlayIcon/> Начать запись
                    </>
                  }
                </Button>
                <Button 
                  onClick={handleExportVideo} 
                  disabled={!recordingChunks.length}
                  variant="secondary"
                  size="medium"
                >
                  Экспорт WebM
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

export default Video