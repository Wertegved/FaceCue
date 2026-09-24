import { useEffect, useRef, useState } from 'react';

function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

function CameraCapture({ onCapture, onCancel, onError }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraError, setCameraError] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        const message = "Camera capture isn't available on this device. You can upload an image instead.";
        setCameraError(message);
        onError(message);
        return;
      }

      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'user' } },
          });
        } catch (error) {
          if (!['OverconstrainedError', 'NotFoundError'].includes(error?.name)) {
            throw error;
          }
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }

        if (cancelled) {
          stopStream(stream);
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
      } catch (error) {
        const message = error?.name === 'NotAllowedError'
          ? 'Camera access was denied. You can continue by uploading an image instead.'
          : "Camera capture isn't available on this device. You can upload an image instead.";
        setCameraError(message);
        onError(message);
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream(streamRef.current);
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      const message = 'The camera is not ready yet. Please try again.';
      setCameraError(message);
      onError(message);
      return;
    }

    setIsCapturing(true);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      setIsCapturing(false);
      if (!blob) {
        const message = 'The camera photo could not be captured. Please try again.';
        setCameraError(message);
        onError(message);
        return;
      }

      stopStream(streamRef.current);
      streamRef.current = null;
      video.srcObject = null;
      onCapture(new File([blob], 'facecue-camera-capture.jpg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  }

  return (
    <div className="camera-capture upload-dropzone" aria-label="Camera capture">
      {cameraError ? (
        <p className="camera-error">{cameraError}</p>
      ) : (
        <video ref={videoRef} className="camera-video" autoPlay muted playsInline aria-label="Live camera preview" />
      )}
      <div className="camera-actions">
        {!cameraError && (
          <button type="button" className="primary-button camera-capture-button" disabled={isCapturing} onClick={handleCapture}>
            {isCapturing ? 'Capturing...' : 'Capture Photo'}
          </button>
        )}
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default CameraCapture;
