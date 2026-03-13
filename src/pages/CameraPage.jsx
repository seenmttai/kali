import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { FaceMesh } from '@mediapipe/face_mesh';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, X, RefreshCw, Zap, ZapOff, Grid3X3, 
  Hand, Eye, HelpCircle, ArrowLeftRight, Check, RotateCcw,
  Scissors, Video, Image as ImageIcon, ArrowRight, Play,
  Maximize, List
} from 'lucide-react';
import { submitDiagnosticData } from '../utils/api';
import LottiePlayer from '../components/common/LottiePlayer';

const STEPS = [
  { id: 'EYE', title: 'Eye', icon: Eye, desc: 'Capture your right full eye and surrounding area.' },
  { id: 'VIDEO', title: 'Video: Fist to Open', icon: Video, desc: 'Record for 10s: start with tight fist, then open it slowly.' },
  { id: 'NAILS_ALL', title: 'Nails (All)', icon: Hand, desc: 'Capture all fingernails clearly in one frame.' },
];

export default function CameraPage() {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  
  // Wizard state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [phase, setPhase] = useState('INSTRUCTIONS'); // INSTRUCTIONS, CAPTURE, REVIEW, SUBMITTING
  const [capturedData, setCapturedData] = useState({}); // { VIDEO: blob, NAILS_ALL: blob, ... }
  
  // Camera state
  const [facingMode, setFacingMode] = useState('environment'); // fallback flag for explicit flips
  const [hasUserFlipped, setHasUserFlipped] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  // Video Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Photo Review/Crop state
  const [reviewUrl, setReviewUrl] = useState(null);
  const [sourceUrl, setSourceUrl] = useState(null);
  
  const safeSetReviewUrl = (newUrl) => {
    setReviewUrl(prev => {
      if (prev && prev.startsWith('blob:') && prev !== sourceUrl && prev !== newUrl) {
        URL.revokeObjectURL(prev);
      }
      return newUrl;
    });
  };

  const [cropRegion, setCropRegion] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [dragInfo, setDragInfo] = useState({ active: false, type: null, startX: 0, startY: 0, initialRegion: null });
  const [lastBlob, setLastBlob] = useState(null);

  // Freeform (Lasso) Crop state
  const [lassoPath, setLassoPath] = useState([]);
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);
  const imageWrapperRef = useRef(null);

  // MediaPipe FaceMesh state
  const canvasRef = useRef(null);
  const faceMeshRef = useRef(null);
  const [isFaceMeshLoaded, setIsFaceMeshLoaded] = useState(false);

  // Full right eye indices
  const RIGHT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];

  const currentStep = STEPS[currentStepIndex];

  // Initialize FaceMesh logic when entering EYE step capture
  useEffect(() => {
    let animationFrameId;

    if (phase === 'CAPTURE' && currentStep.id === 'EYE') {
      faceMeshRef.current = new FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        }
      });
      faceMeshRef.current.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      faceMeshRef.current.onResults(onFaceMeshResults);
      setIsFaceMeshLoaded(true);

      let lastVideoTime = 0;
      const processVideo = async () => {
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState >= 2 && faceMeshRef.current) {
          const video = webcamRef.current.video;
          if (video.currentTime !== lastVideoTime) {
            lastVideoTime = video.currentTime;
            try {
              await faceMeshRef.current.send({ image: video });
            } catch (e) {
              console.error("FaceMesh error:", e);
            }
          }
        }
        animationFrameId = requestAnimationFrame(processVideo);
      };

      processVideo();
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (faceMeshRef.current) {
        faceMeshRef.current.close();
        faceMeshRef.current = null;
      }
      setIsFaceMeshLoaded(false);
    };
  }, [phase, currentStep.id]);

  // Reset flip state when moving between steps to allow default camera logic to run
  useEffect(() => {
    setHasUserFlipped(false);
  }, [currentStepIndex]);

  // Handle Camera Defaults per Step
  useEffect(() => {
    if (phase === 'CAPTURE' && !hasUserFlipped) {
      if (currentStep.id === 'EYE') {
        setFacingMode('user');
      } else {
        setFacingMode('environment');
      }
    }
  }, [phase, currentStep.id, hasUserFlipped]);

  const onFaceMeshResults = (results) => {
    if (!canvasRef.current || !webcamRef.current?.video) return;
    const canvasCtx = canvasRef.current.getContext('2d');
    const video = webcamRef.current.video;
    
    // Clear canvas
    canvasCtx.fillStyle = '#f2f2f2';
    canvasCtx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
      const eyePoints = RIGHT_EYE_INDICES.map(index => {
          const x = landmarks[index].x * video.videoWidth;
          const y = landmarks[index].y * video.videoHeight;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          return { x, y };
      });

      // padding to include surrounding areas of the eye
      const padding = 80;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      const width = maxX - minX + (padding * 2);
      const height = maxY - minY + (padding * 2);

      canvasCtx.save();
      const scale = Math.min(canvasRef.current.width / width, canvasRef.current.height / height);
      const offsetX = (canvasRef.current.width - width * scale) / 2;
      const offsetY = (canvasRef.current.height - height * scale) / 2;

      canvasCtx.translate(offsetX, offsetY);
      canvasCtx.scale(scale, scale);
      canvasCtx.translate(-minX, -minY);

      canvasCtx.save();
      // Mirror the video drawing since webcam is mirrored
      canvasCtx.translate(video.videoWidth, 0);
      canvasCtx.scale(-1, 1);
      canvasCtx.drawImage(results.image, 0, 0, video.videoWidth, video.videoHeight);
      canvasCtx.restore();
      
      canvasCtx.restore();
    }
  };

  // Video Constraints - Keep very simple to prevent NotReadableError
  const videoConstraints = {
    // Only pass facingMode if the user explicitly clicked the flip button, otherwise let device default (usually rear anyway, or whatever is free)
    ...(hasUserFlipped && { facingMode }),
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };

  // Error Handler
  const handleUserMediaError = useCallback((error) => {
    console.warn("Camera Error:", error);
    if (!hasUserFlipped) {
       // If the initial default stream fails, try forcing it to user to see if it works
       setHasUserFlipped(true);
       setFacingMode('user');
    }
  }, [hasUserFlipped]);

  // --- Video Recording Logic ---
  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

  const handleStartCaptureClick = useCallback(() => {
    setRecordedChunks([]);
    if (!webcamRef.current?.video?.srcObject) return;
    
    const stream = webcamRef.current.video.srcObject;
    
    // Check for supported MIME types
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9") 
      ? "video/webm;codecs=vp9" 
      : (MediaRecorder.isTypeSupported("video/webm") ? "video/webm" : "video/mp4");
      
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
  }, [webcamRef, mediaRecorderRef, setIsRecording, handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  }, [mediaRecorderRef, setIsRecording]);

  useEffect(() => {
    let timer;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 10) {
            handleStopCaptureClick();
            return 10;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording, handleStopCaptureClick]);

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording && phase === 'CAPTURE') {
      const type = recordedChunks[0].type || "video/webm";
      const blob = new Blob(recordedChunks, { type });
      const url = URL.createObjectURL(blob);
      safeSetReviewUrl(url);
      setSourceUrl(url);
      setPhase('REVIEW');
    }
  }, [recordedChunks, isRecording, phase]);

  // --- Photo Capture Logic ---
  const handleCapture = useCallback(() => {
    let imageSrc;
    if (currentStep.id === 'EYE' && canvasRef.current) {
      imageSrc = canvasRef.current.toDataURL('image/jpeg', 1.0);
    } else {
      imageSrc = webcamRef.current.getScreenshot();
    }
    safeSetReviewUrl(imageSrc);
    setSourceUrl(imageSrc);
    setPhase('REVIEW');
    setLassoPath([]); // Reset lasso 
    setCropRegion({ x: 10, y: 10, width: 80, height: 80 });
  }, [webcamRef, currentStep.id, reviewUrl, sourceUrl]);

  const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // --- Touch & Mouse Crop Logic ---
  const handleCropStart = (e, type) => {
    e.stopPropagation();
    const pos = getClientPos(e);
    if (pos.clientX === undefined) return;
    setDragInfo({
      active: true,
      type, // 'move', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
      startX: pos.clientX,
      startY: pos.clientY,
      initialRegion: { ...cropRegion }
    });
  };

  const handleCropMove = (e) => {
    if (!dragInfo.active) return;
    const pos = getClientPos(e);
    if (pos.clientX === undefined) return;
    
    // Prevent default scrolling on mobile if actively dragging crop box
    if (e.cancelable) e.preventDefault();

    const dx = ((pos.clientX - dragInfo.startX) / window.innerWidth) * 100;
    const dy = ((pos.clientY - dragInfo.startY) / window.innerHeight) * 100;

    setCropRegion(prev => {
      let next = { ...prev };
      const ir = dragInfo.initialRegion;

      if (dragInfo.type === 'move') {
        next.x = Math.max(0, Math.min(100 - ir.width, ir.x + dx));
        next.y = Math.max(0, Math.min(100 - ir.height, ir.y + dy));
      } else if (dragInfo.type === 'top-left') {
        next.x = Math.max(0, Math.min(ir.x + ir.width - 10, ir.x + dx));
        next.y = Math.max(0, Math.min(ir.y + ir.height - 10, ir.y + dy));
        next.width = ir.width - (next.x - ir.x);
        next.height = ir.height - (next.y - ir.y);
      } else if (dragInfo.type === 'bottom-right') {
        next.width = Math.max(10, Math.min(100 - ir.x, ir.width + dx));
        next.height = Math.max(10, Math.min(100 - ir.y, ir.height + dy));
      } else if (dragInfo.type === 'top-right') {
        next.y = Math.max(0, Math.min(ir.y + ir.height - 10, ir.y + dy));
        next.width = Math.max(10, Math.min(100 - ir.x, ir.width + dx));
        next.height = ir.height - (next.y - ir.y);
      } else if (dragInfo.type === 'bottom-left') {
        next.x = Math.max(0, Math.min(ir.x + ir.width - 10, ir.x + dx));
        next.width = ir.width - (next.x - ir.x);
        next.height = Math.max(10, Math.min(100 - ir.y, ir.height + dy));
      }
      return next;
    });
  };

  const handleCropEnd = () => {
    setDragInfo({ active: false, type: null, startX: 0, startY: 0, initialRegion: null });
  };

  // --- Image Cropping Logic ---
  const cropImage = async (imageSrc, region) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scaleX = img.naturalWidth / 100;
        const scaleY = img.naturalHeight / 100;
        
        canvas.width = region.width * scaleX;
        canvas.height = region.height * scaleY;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          img,
          region.x * scaleX,
          region.y * scaleY,
          region.width * scaleX,
          region.height * scaleY,
          0,
          0,
          canvas.width,
          canvas.height
        );
        
        canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
      };
      img.src = imageSrc;
    });
  };

  const cropImageFreeform = async (imageSrc, pathPoints) => {
    return new Promise((resolve) => {
      if (!pathPoints || pathPoints.length < 3) {
        // Fallback: no drawing, send whole image
        fetch(imageSrc).then(r => r.blob()).then(resolve);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        let minX = img.naturalWidth, minY = img.naturalHeight, maxX = 0, maxY = 0;
        pathPoints.forEach(p => {
          const px = (p.x / 100) * img.naturalWidth;
          const py = (p.y / 100) * img.naturalHeight;
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        });
        
        const padding = 20;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(img.naturalWidth, maxX + padding);
        maxY = Math.min(img.naturalHeight, maxY + padding);

        const cropWidth = maxX - minX;
        const cropHeight = maxY - minY;
        
        const canvas = document.createElement('canvas');
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        const ctx = canvas.getContext('2d');
        
        ctx.beginPath();
        pathPoints.forEach((p, i) => {
          const px = (p.x / 100) * img.naturalWidth - minX;
          const py = (p.y / 100) * img.naturalHeight - minY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(img, -minX, -minY);
        
        canvas.toBlob((blob) => resolve(blob), 'image/png'); // Needs to be PNG for transparency outside lasso
      };
      img.src = imageSrc;
    });
  };

  // --- Touch & Mouse Lasso Drawing Logic ---
  const handleLassoStart = (e) => {
    e.stopPropagation();
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault(); // allow drawing
    if (!imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const pos = getClientPos(e);
    if (pos.clientX === undefined) return;
    const x = Math.max(0, Math.min(100, ((pos.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((pos.clientY - rect.top) / rect.height) * 100));
    setLassoPath([{x, y}]);
    
    if (e.type.startsWith('mouse')) setIsLassoDrawing(true);
  };

  const handleLassoMove = (e) => {
    e.stopPropagation();
    if (e.type.startsWith('mouse') && !isLassoDrawing) return;
    if (e.cancelable && e.type.startsWith('touch')) e.preventDefault();
    if (!imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const pos = getClientPos(e);
    if (pos.clientX === undefined) return;
    const x = Math.max(0, Math.min(100, ((pos.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((pos.clientY - rect.top) / rect.height) * 100));
    setLassoPath(prev => [...prev, {x, y}]);
  };

  const handleLassoEnd = () => {
    setIsLassoDrawing(false);
  };

  // --- Wizard Navigation ---
  const handleConfirmReview = async () => {
    if (currentStep.id === 'VIDEO') {
      const finalBlob = new Blob(recordedChunks, { type: "video/webm" });
      setLastBlob(finalBlob);
      setPhase('RESULT_PREVIEW');
      return;
    }

    let croppedBlob = null;
    if (currentStep.id === 'EYE') {
      croppedBlob = await cropImageFreeform(reviewUrl, lassoPath);
    } else {
      croppedBlob = await cropImage(reviewUrl, cropRegion);
    }

    const newUrl = URL.createObjectURL(croppedBlob);
    safeSetReviewUrl(newUrl);
    setLastBlob(croppedBlob);
    setPhase('RESULT_PREVIEW');
  };

  const handleFinalAccept = () => {
    setCapturedData(prev => ({ ...prev, [currentStep.id]: lastBlob }));

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setPhase('INSTRUCTIONS');
      safeSetReviewUrl(null);
      setSourceUrl(null);
      setLastBlob(null);
    } else {
      setPhase('SUBMITTING');
      handleSubmit();
    }
  };

  const handleResetToOriginal = () => {
    safeSetReviewUrl(sourceUrl);
    setLassoPath([]);
    setCropRegion({ x: 10, y: 10, width: 80, height: 80 });
    setPhase('REVIEW');
  };

  const handleCropMore = () => {
    setLassoPath([]);
    setCropRegion({ x: 10, y: 10, width: 80, height: 80 });
    setPhase('REVIEW');
  };

  const handleRetake = () => {
    setPhase('CAPTURE');
    if (sourceUrl && sourceUrl.startsWith('blob:')) {
        URL.revokeObjectURL(sourceUrl);
    }
    safeSetReviewUrl(null);
    setSourceUrl(null);
    setLastBlob(null);
  };

  const handleSubmit = async () => {
    try {
      // Small delay for Lottie appreciation
      await new Promise(r => setTimeout(r, 2000));
      const response = await submitDiagnosticData(capturedData);
      navigate('/results', { state: { apiResponse: response, multiStep: true } });
    } catch (err) {
      console.error("Submission failed", err);
      // Fallback to mock results if API fails
      navigate('/results', { state: { category: 'Normal', score: 85, mock: true } });
    }
  };

  // --- Render Helpers ---
  if (phase === 'SUBMITTING') {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', padding: '20px', textAlign: 'center' }}>
        <div style={{ width: '280px', height: '280px' }}>
          <LottiePlayer src="https://lottie.host/807ad9d4-1a61-45f8-958b-3df8d34190c4/8vWc6p87kY.json" />
        </div>
        <h2 className="animate-pulse-soft">Processing Analysis...</h2>
        <p style={{ color: 'var(--text-secondary)' }}>We are analyzing your video and photo captures using our deep learning engine.</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: '#000', zIndex: 9999, display: 'flex', flexDirection: 'column', color: 'white' }}>
      
      {/* Navbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)}><X size={28} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', background: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: '20px' }}>
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
        </div>
        <div style={{ width: 28 }} />
      </div>

      {phase === 'INSTRUCTIONS' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', backgroundColor: '#000' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(13, 148, 136, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <currentStep.icon size={60} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>{currentStep.title}</h2>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, marginBottom: '40px' }}>{currentStep.desc}</p>
          <button 
            onClick={() => setPhase('CAPTURE')}
            style={{ padding: '16px 40px', borderRadius: '30px', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', boxShadow: '0 4px 15px rgba(13, 148, 136, 0.4)' }}
          >
            Start Capture
          </button>
        </div>
      )}

      {phase === 'CAPTURE' && (
        <>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMediaError={handleUserMediaError}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {showGrid && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, transparent 33.3%, rgba(255,255,255,0.3) 33.3%, rgba(255,255,255,0.3) 33.6%, transparent 33.6%, transparent 66.6%, rgba(255,255,255,0.3) 66.6%, rgba(255,255,255,0.3) 66.9%, transparent 66.9%), linear-gradient(to bottom, transparent 33.3%, rgba(255,255,255,0.3) 33.3%, rgba(255,255,255,0.3) 33.6%, transparent 33.6%, transparent 66.6%, rgba(255,255,255,0.3) 66.6%, rgba(255,255,255,0.3) 66.9%, transparent 66.9%)', pointerEvents: 'none' }} />}
            
            {/* Guide Overlays */}
            {currentStep.id === 'EYE' ? (
              <div style={{ position: 'absolute', inset: 'auto 15% 10% 15%', height: '224px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '16px', border: '2px solid var(--color-primary)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <canvas ref={canvasRef} width={280} height={280} style={{ borderRadius: '8px', backgroundColor: '#f2f2f2', transform: 'scaleX(-1)', maxWidth: '100%', height: 'auto' }} />
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>Live Eye Region</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Hold still while AI tracks your eye.</div>
                </div>
              </div>
            ) : (
              <div style={{ position: 'absolute', inset: '15% 15%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: '24px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <currentStep.icon size={100} color="rgba(255,255,255,0.2)" />
              </div>
            )}

            {isRecording && (
              <div style={{ position: 'absolute', top: '100px', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(249, 112, 102, 0.8)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>REC 00:{recordingTime.toString().padStart(2, '0')}</div>
                <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(recordingTime/10)*100}%`, height: '100%', background: 'var(--color-danger)', transition: 'width 1s linear' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '24px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-around', position: 'relative', zIndex: 100 }}>
            <button 
              onClick={() => setShowGrid(!showGrid)}
              style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}
            >
              <Grid3X3 size={24} color={showGrid ? "var(--color-primary)" : "white"} />
            </button>
            
            {currentStep.id === 'VIDEO' ? (
              <button 
                onClick={isRecording ? handleStopCaptureClick : handleStartCaptureClick}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', background: 'transparent', padding: '4px' }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: isRecording ? '4px' : '50%', background: 'var(--color-danger)', transition: 'all 0.2s' }} />
              </button>
            ) : (
              <button 
                onClick={handleCapture}
                style={{ width: '80px', height: '80px', borderRadius: '50%', border: '4px solid white', background: 'transparent', padding: '4px' }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'white' }} />
              </button>
            )}

            <button 
              onClick={() => { setHasUserFlipped(true); setFacingMode(f => f === 'user' ? 'environment' : 'user'); }}
              style={{ padding: '12px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCw size={24} color="white" />
              <span style={{ fontSize: '0.6rem', color: 'white', fontWeight: 'bold' }}>FLIP</span>
            </button>
          </div>
        </>
      )}

      {phase === 'REVIEW' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentStep.id === 'VIDEO' ? (
              <video 
                key={reviewUrl}
                src={reviewUrl} 
                autoPlay 
                loop 
                muted 
                playsInline 
                style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', background: '#000' }} 
              />
            ) : currentStep.id === 'EYE' ? (
              <div 
                ref={imageWrapperRef}
                style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', maxHeight: '70vh', touchAction: 'none' }}
                onTouchStart={handleLassoStart}
                onTouchMove={handleLassoMove}
                onTouchEnd={handleLassoEnd}
                onMouseDown={handleLassoStart}
                onMouseMove={handleLassoMove}
                onMouseUp={handleLassoEnd}
                onMouseLeave={handleLassoEnd}
              >
                 <img draggable={false} src={reviewUrl} style={{ display: 'block', maxWidth: '100%', maxHeight: '70vh', pointerEvents: 'none', borderRadius: '12px' }} />
                 <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}>
                    {lassoPath.length > 0 && (
                      <>
                        <polygon 
                          points={lassoPath.map(p => `${p.x},${p.y}`).join(' ')} 
                          fill="rgba(13, 148, 136, 0.3)" 
                          stroke="#0D9488" 
                          strokeWidth="0.5" 
                          strokeLinejoin="round"
                        />
                        <polyline 
                          points={lassoPath.map(p => `${p.x},${p.y}`).join(' ')} 
                          fill="none" 
                          stroke="white" 
                          strokeWidth="0.8" 
                          strokeDasharray="1,1" 
                        />
                      </>
                    )}
                 </svg>
                 <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 110, whiteSpace: 'nowrap' }}>
                    <button onClick={() => setLassoPath([])} style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.3)' }}>
                       <RotateCcw size={16} /> Clear Drawing
                    </button>
                 </div>
              </div>
            ) : (
              <div 
                style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', touchAction: 'none' }}
                onTouchMove={handleCropMove}
                onTouchEnd={handleCropEnd}
                onMouseMove={handleCropMove}
                onMouseUp={handleCropEnd}
                onMouseLeave={handleCropEnd}
              >
                <img draggable={false} src={reviewUrl} style={{ maxWidth: '100%', maxHeight: '100%', pointerEvents: 'none' }} />
                
                {/* Visual Crop Guide (The Box itself is draggable) */}
                <div 
                  onTouchStart={(e) => handleCropStart(e, 'move')}
                  onMouseDown={(e) => handleCropStart(e, 'move')}
                  style={{ 
                    position: 'absolute', border: '2.5px solid var(--color-primary)', 
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', 
                    top: `${cropRegion.y}%`, left: `${cropRegion.x}%`, 
                    width: `${cropRegion.width}%`, height: `${cropRegion.height}%`,
                    zIndex: 10, cursor: 'move'
                  }}
                >
                   {/* Corner Handles */}
                   <div onTouchStart={(e) => handleCropStart(e, 'top-left')} onMouseDown={(e) => handleCropStart(e, 'top-left')} style={{ position: 'absolute', top: -15, left: -15, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nwse-resize' }}><div style={{ width: 14, height: 14, borderLeft: '4px solid white', borderTop: '4px solid white' }} /></div>
                   <div onTouchStart={(e) => handleCropStart(e, 'top-right')} onMouseDown={(e) => handleCropStart(e, 'top-right')} style={{ position: 'absolute', top: -15, right: -15, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nesw-resize' }}><div style={{ width: 14, height: 14, borderRight: '4px solid white', borderTop: '4px solid white' }} /></div>
                   <div onTouchStart={(e) => handleCropStart(e, 'bottom-left')} onMouseDown={(e) => handleCropStart(e, 'bottom-left')} style={{ position: 'absolute', bottom: -15, left: -15, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nesw-resize' }}><div style={{ width: 14, height: 14, borderLeft: '4px solid white', borderBottom: '4px solid white' }} /></div>
                   <div onTouchStart={(e) => handleCropStart(e, 'bottom-right')} onMouseDown={(e) => handleCropStart(e, 'bottom-right')} style={{ position: 'absolute', bottom: -15, right: -15, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'nwse-resize' }}><div style={{ width: 14, height: 14, borderRight: '4px solid white', borderBottom: '4px solid white' }} /></div>
                   
                   {/* Center Indicator */}
                   <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }}><Scissors size={24} color="white" /></div>
                </div>

                {/* Reset Action */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', zIndex: 110 }}>
                   <button onClick={() => setCropRegion({ x: 10, y: 10, width: 80, height: 80 })} style={{ padding: '8px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                      <Maximize size={16} /> Reset Zoom
                   </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Review Card and Action Buttons merged */}
          <div style={{ padding: '30px 20px 40px', background: 'var(--bg-card)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 200, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', fontSize: '1.4rem' }}>{currentStep.id === 'VIDEO' ? 'Confirm Video' : currentStep.id === 'EYE' ? 'Trace the Eye' : 'Adjust & Accept'}</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
              {currentStep.id === 'VIDEO' ? 'Start tight fist, then open. Clear?' : currentStep.id === 'EYE' ? 'Use your finger or mouse to draw a boundary around the conjunctiva area.' : 'Center and crop the area of interest.'}
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', width: '100%', zIndex: 100, padding: '10px 0', pointerEvents: 'auto' }}>
              {/* Premium Retake Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleRetake(); }}
                className="tap-bounce"
                style={{
                  width: '72px', height: '72px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #F97066 0%, #EF4444 100%)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 8px 32px rgba(239, 68, 68, 0.35)', 
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                <X size={28} color="white" />
                <span style={{ fontSize: '0.65rem', fontWeight: '800', letterSpacing: '0.05em', marginTop: '2px', color: 'white', fontFamily: 'var(--font-heading)' }}>RETAKE</span>
              </button>

              {/* Premium Confirm Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleConfirmReview(); }}
                className="tap-bounce animate-pulse-soft"
                style={{
                  width: '94px', height: '94px', borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #10B981 0%, #0D9488 100%)', 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                  boxShadow: '0 12px 48px rgba(13, 148, 136, 0.45)', 
                  border: '4px solid rgba(255, 255, 255, 0.5)',
                  backdropFilter: 'blur(8px)',
                  transform: 'translateY(-12px)',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer',
                  pointerEvents: 'auto'
                }}
              >
                <Check size={42} color="white" />
                <span style={{ fontSize: '0.75rem', fontWeight: '900', letterSpacing: '0.05em', marginTop: '2px', color: 'white', fontFamily: 'var(--font-heading)' }}>CORRECT</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'RESULT_PREVIEW' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {currentStep.id === 'VIDEO' ? (
              <video 
                key={reviewUrl}
                src={reviewUrl} 
                autoPlay 
                loop 
                muted 
                playsInline 
                controls 
                style={{ width: '100%', maxHeight: '70vh', borderRadius: '12px', background: '#000' }} 
              />
            ) : (
              <img src={reviewUrl} style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: '12px', boxShadow: '0 0 40px rgba(0,0,0,0.8)' }} />
            )}
          </div>

          <div style={{ padding: '30px 20px 40px', background: 'var(--bg-card)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 200, boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
            <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', fontSize: '1.4rem' }}>{currentStep.id === 'VIDEO' ? 'Video Review' : 'Crop Review'}</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '24px' }}>
              {currentStep.id === 'VIDEO' ? 'Confirm your video capture.' : 'Happy with this crop, or want to refine it further?'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', width: '100%', flexWrap: 'wrap', pointerEvents: 'auto' }}>
              {/* Retake */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleRetake(); }}
                className="tap-bounce"
                style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                <X size={18} /> Retake
              </button>

              {currentStep.id !== 'VIDEO' && (
                <>
                  {/* Reset */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleResetToOriginal(); }}
                    className="tap-bounce"
                    style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <RotateCcw size={18} /> Reset
                  </button>

                  {/* Crop More */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleCropMore(); }}
                    className="tap-bounce"
                    style={{ padding: '12px 20px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3B82F6', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    <Scissors size={18} /> Crop More
                  </button>
                </>
              )}

              {/* Accept */}
              <button 
                onClick={(e) => { e.stopPropagation(); handleFinalAccept(); }}
                className="tap-bounce"
                style={{ padding: '12px 32px', borderRadius: '16px', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(13, 148, 136, 0.3)', cursor: 'pointer' }}
              >
                <Check size={18} /> Final Accept
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

