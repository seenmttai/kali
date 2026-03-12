import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, X, RefreshCw, Zap, ZapOff, Grid3X3, 
  Hand, Eye, HelpCircle, ArrowLeftRight, Check, RotateCcw,
  Scissors, Video, Image as ImageIcon, ArrowRight, Play,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus,
  Minus, Maximize, List
} from 'lucide-react';
import { submitDiagnosticData } from '../utils/api';
import LottiePlayer from '../components/common/LottiePlayer';

const STEPS = [
  { id: 'VIDEO', title: 'Video: Fist to Open', icon: Video, desc: 'Record for 10s: start with tight fist, then open it slowly.' },
  { id: 'NAILS_ALL', title: 'Nails (All)', icon: Hand, desc: 'Capture all fingernails clearly in one frame.' },
  { id: 'NAIL_CLOSEUP', title: 'Nail (Closeup)', icon: Hand, desc: 'Closeup of a single fingernail.' },
  { id: 'PALM', title: 'Palm', icon: Hand, desc: 'Capture the center of your palm.' },
  { id: 'EYE', title: 'Eye', icon: Eye, desc: 'Capture a clear closeup of your lower eyelid.' }
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
  const [facingMode, setFacingMode] = useState('environment');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  
  // Video Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Photo Review/Crop state
  const [reviewUrl, setReviewUrl] = useState(null);
  const [cropRegion, setCropRegion] = useState({ x: 10, y: 10, width: 80, height: 80 });

  const currentStep = STEPS[currentStepIndex];

  // Video Constraints
  const videoConstraints = {
    facingMode,
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  };

  // --- Video Recording Logic ---
  const handleStartCaptureClick = useCallback(() => {
    setRecordedChunks([]);
    const stream = webcamRef.current.video.srcObject;
    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
  }, [webcamRef, mediaRecorderRef, setIsRecording]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    [setRecordedChunks]
  );

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
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      setReviewUrl(url);
      setPhase('REVIEW');
    }
  }, [recordedChunks, isRecording]);

  // --- Photo Capture Logic ---
  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setReviewUrl(imageSrc);
    setPhase('REVIEW');
  }, [webcamRef]);

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

  // --- Wizard Navigation ---
  const handleConfirmReview = async () => {
    let finalBlob = null;
    if (currentStep.id === 'VIDEO') {
      finalBlob = new Blob(recordedChunks, { type: "video/webm" });
    } else {
      // Actually crop the image
      finalBlob = await cropImage(reviewUrl, cropRegion);
    }

    setCapturedData(prev => ({ ...prev, [currentStep.id]: finalBlob }));

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setPhase('INSTRUCTIONS');
      setReviewUrl(null);
    } else {
      setPhase('SUBMITTING');
      handleSubmit();
    }
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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {showGrid && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, transparent 33.3%, rgba(255,255,255,0.3) 33.3%, rgba(255,255,255,0.3) 33.6%, transparent 33.6%, transparent 66.6%, rgba(255,255,255,0.3) 66.6%, rgba(255,255,255,0.3) 66.9%, transparent 66.9%), linear-gradient(to bottom, transparent 33.3%, rgba(255,255,255,0.3) 33.3%, rgba(255,255,255,0.3) 33.6%, transparent 33.6%, transparent 66.6%, rgba(255,255,255,0.3) 66.6%, rgba(255,255,255,0.3) 66.9%, transparent 66.9%)', pointerEvents: 'none' }} />}
            
            {/* Guide Overlays */}
            <div style={{ position: 'absolute', inset: '15% 15%', border: '2px dashed rgba(255,255,255,0.5)', borderRadius: currentStep.id === 'EYE' ? '50% 10%' : '24px', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <currentStep.icon size={100} color="rgba(255,255,255,0.2)" />
            </div>

            {isRecording && (
              <div style={{ position: 'absolute', top: '100px', left: '0', right: '0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'rgba(249, 112, 102, 0.8)', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold' }}>REC 00:{recordingTime.toString().padStart(2, '0')}</div>
                <div style={{ width: '200px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${(recordingTime/10)*100}%`, height: '100%', background: 'var(--color-danger)', transition: 'width 1s linear' }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: '24px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'space-around' }}>
            <button onClick={() => setShowGrid(!showGrid)}><Grid3X3 size={24} color={showGrid ? "var(--color-primary)" : "white"} /></button>
            
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

            <button onClick={() => setFacingMode(f => f === 'user' ? 'environment' : 'user')}><RefreshCw size={24} /></button>
          </div>
        </>
      )}

      {phase === 'REVIEW' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#000' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {currentStep.id === 'VIDEO' ? (
              <video src={reviewUrl} autoPlay loop muted playsInline style={{ width: '100%', maxHeight: '70vh' }} />
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={reviewUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                
                {/* Visual Crop Guide with Adjustment Buttons */}
                <div style={{ 
                  position: 'absolute', border: '2px solid var(--color-primary)', 
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)', 
                  top: `${cropRegion.y}%`, left: `${cropRegion.x}%`, 
                  width: `${cropRegion.width}%`, height: `${cropRegion.height}%`,
                  pointerEvents: 'none'
                }}>
                   <div style={{ position: 'absolute', top: -10, left: -10, background: 'var(--color-primary)', borderRadius: '50%', padding: '4px' }}><Scissors size={14} color="white" /></div>
                </div>

                {/* Crop Adjusters - Reimagined as a more intuitive control panel */}
                <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setCropRegion({ x: 10, y: 10, width: 80, height: 80 })} style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Reset"><Maximize size={22} /></button>
                  </div>

                  <div style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', padding: '12px', borderRadius: '24px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <button onClick={() => {
                      setCropRegion(p => ({
                        ...p,
                        width: Math.max(10, p.width - 5),
                        height: Math.max(10, p.height - 5),
                        x: Math.min(100 - Math.max(10, p.width - 5), p.x + 2.5),
                        y: Math.min(100 - Math.max(10, p.height - 5), p.y + 2.5)
                      }));
                    }} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={20} /></button>
                    
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '40px', textAlign: 'center' }}>{Math.round(100 - cropRegion.width)}%</span>
                    
                    <button onClick={() => {
                      setCropRegion(p => ({
                        ...p,
                        width: Math.min(100, p.width + 5),
                        height: Math.min(100, p.height + 5),
                        x: Math.max(0, p.x - 2.5),
                        y: Math.max(0, p.y - 2.5)
                      }));
                    }} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 40px)', gap: '4px' }}>
                    <div />
                    <button onClick={() => setCropRegion(p => ({ ...p, y: Math.max(0, p.y - 2) }))} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronUp size={20} /></button>
                    <div />
                    <button onClick={() => setCropRegion(p => ({ ...p, x: Math.max(0, p.x - 2) }))} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={20} /></button>
                    <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}><ArrowLeftRight size={16} /></div>
                    <button onClick={() => setCropRegion(p => ({ ...p, x: Math.min(100 - p.width, p.x + 2) }))} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={20} /></button>
                    <div />
                    <button onClick={() => setCropRegion(p => ({ ...p, y: Math.min(100 - p.height, p.y + 2) }))} style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={20} /></button>
                    <div />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Floating Action Buttons for Right/Wrong */}
          <div style={{ position: 'absolute', bottom: '40px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '30px', zIndex: 100 }}>
            {/* Wrong / Retake */}
            <button 
              onClick={() => { setPhase('CAPTURE'); setReviewUrl(null); }}
              style={{
                width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(249, 112, 102, 0.9)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                boxShadow: '0 8px 32px rgba(249, 112, 102, 0.4)', border: '2px solid white'
              }}
            >
              <X size={32} color="white" />
              <span style={{ fontSize: '0.6rem', fontWeight: 'bold' }}>RETAKE</span>
            </button>

            {/* Right / Confirm */}
            <button 
              onClick={handleConfirmReview}
              style={{
                width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.9)', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.4)', border: '4px solid white', transform: 'translateY(-10px)'
              }}
            >
              <Check size={40} color="white" />
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>CORRECT</span>
            </button>
          </div>

          <div style={{ padding: '30px 20px 100px', background: 'var(--bg-card)', borderTopLeftRadius: '30px', borderTopRightRadius: '30px' }}>
            <h3 style={{ margin: '0 0 8px 0', textAlign: 'center', fontSize: '1.4rem' }}>{currentStep.id === 'VIDEO' ? 'Confirm Video' : 'Adjust & Accept'}</h3>
            <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '10px' }}>
              {currentStep.id === 'VIDEO' ? 'Start tight fist, then open. Clear?' : 'Center and crop the area of interest.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

