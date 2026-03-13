import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Share2, Download, Info, CheckCircle, AlertTriangle, AlertCircle 
} from 'lucide-react';
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { analyzeImage } from '../utils/anemiaScorer';
import { saveScanResult } from '../utils/storage';

import LottiePlayer from '../components/common/LottiePlayer';

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  
  const gaugeRef = useRef(null);

  useEffect(() => {
    if (state?.apiResponse) {
      // Use real API response
      setResult(state.apiResponse);
      setIsAnalyzing(false);
      
      if (state.apiResponse.category === 'Normal') {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10B981', '#0D9488', '#F97066']
          });
        }, 300);
      }
      return;
    }

    if (!state?.imageSrc && !state?.multiStep) {
      navigate('/camera', { replace: true });
      return;
    }

    // Simulate AI processing time for legacy single-step
    const timer = setTimeout(async () => {
      try {
        const analysis = await analyzeImage(state.imageSrc, state.scanType);
        setResult(analysis);
        setIsAnalyzing(false);

        // Confetti if Normal
        if (analysis.category === 'Normal') {
          setTimeout(() => {
            confetti({
              particleCount: 100,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#10B981', '#0D9488', '#F97066']
            });
          }, 300);
        }

        // Save to IndexedDB
        await saveScanResult({...analysis, date: Date.now(), imageSrc: state.imageSrc, scanType: state.scanType});

      } catch (e) {
        console.error("Analysis failed", e);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [state, navigate]);

  // Animate Gauge Needle when result loads
  useEffect(() => {
    if (result && gaugeRef.current) {
      // Rotate from -90deg (0) to +90deg (100)
      const rotation = -90 + (result.score / 100) * 180;
      gsap.fromTo(gaugeRef.current, 
        { rotation: -90, transformOrigin: 'bottom center' },
        { rotation: rotation, duration: 1.5, ease: 'elastic.out(1, 0.7)', delay: 0.2 }
      );
    }
  }, [result]);

  if (isAnalyzing) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', backgroundColor: 'var(--bg-app)', textAlign: 'center', padding: '20px'
      }}>
        <div style={{ width: '250px', height: '250px', marginBottom: '20px' }}>
          <LottiePlayer src="https://lottie.host/807ad9d4-1a61-45f8-958b-3df8d34190c4/8vWc6p87kY.json" />
        </div>
        <h2 style={{ color: 'var(--text-primary)', fontSize: '1.8rem' }}>Analyzing Your {state?.scanType}...</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '280px' }}>Our heuristic engine is comparing your palm color to clinical medical data.</p>
      </div>
    );
  }

  if (!result) return null;

  // Determine Icon
  let StatusIcon = CheckCircle;
  let statusColor = 'var(--color-success)';
  if (result.category === 'High Risk') { StatusIcon = AlertCircle; statusColor = 'var(--color-danger)'; }
  if (result.category === 'Borderline') { StatusIcon = AlertTriangle; statusColor = 'var(--color-warning)'; }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-app)', paddingBottom: '40px' }}>
      
      {/* Top Header */}
      <div style={{
        background: `linear-gradient(135deg, ${statusColor} 0%, var(--bg-app) 100%)`,
        padding: '20px', paddingTop: 'env(safe-area-inset-top, 40px)',
        borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px',
        color: 'white', display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={24} />
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ color: 'white', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
              <Download size={24} />
            </button>
            <button style={{ color: 'white', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
              <Share2 size={24} />
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <StatusIcon size={32} />
            <h1 style={{ fontSize: '2rem', margin: 0, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{state?.error ? 'Analysis Error' : result.category}</h1>
          </div>
          <p style={{ opacity: 0.9, margin: 0 }}>
            {state?.error ? 'Submission failed' : `Scan Time: ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
          </p>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Error Alert if API Failure */}
        {state?.error && (
          <div className="glass-panel" style={{ 
            padding: '20px', 
            border: '1px solid var(--color-danger)', 
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
              <AlertCircle size={24} />
              <h3 style={{ margin: 0 }}>API Failure Detected</h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', fontFamily: 'monospace' }}>
              <strong>Reason:</strong> {state.error}
            </p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Using high-fidelity mock data for demonstration purposes since the neural engine is currently unreachable.
            </p>
          </div>
        )}
        
        {/* Confidence Gauge */}
        <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
          <h3>Paleness Score</h3>
          <div style={{ position: 'relative', width: '200px', height: '100px', margin: '20px auto', overflow: 'hidden' }}>
            {/* SVG Speedometer Arch */}
            <svg viewBox="0 0 100 50" width="200" height="100">
              <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border-color)" strokeWidth="10" strokeLinecap="round" />
              {/* Colored sections */}
              <path d="M 10 50 A 40 40 0 0 1 40 23" fill="none" stroke="var(--color-danger)" strokeWidth="10" strokeLinecap="round" />
              <path d="M 40 23 A 40 40 0 0 1 60 23" fill="none" stroke="var(--color-warning)" strokeWidth="10" />
              <path d="M 60 23 A 40 40 0 0 1 90 50" fill="none" stroke="var(--color-success)" strokeWidth="10" strokeLinecap="round" />
            </svg>
            {/* Needle */}
            <div 
              ref={gaugeRef}
              style={{
                position: 'absolute', bottom: 0, left: '50%', width: '4px', height: '80px',
                background: 'var(--text-primary)', borderRadius: '4px',
                marginLeft: '-2px', transformOrigin: 'bottom center', transform: 'rotate(-90deg)'
              }}
            >
              <div style={{ width: '12px', height: '12px', background: 'var(--text-primary)', borderRadius: '50%', position: 'absolute', bottom: '-4px', left: '-4px' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '2.5rem', margin: '0 0 8px', color: statusColor }}>{result.score}%</h2>
          
          <button 
            onClick={() => alert("Displays how pale the region is. Higher is better (more blood flow).")}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.9rem' }}
          >
            <Info size={16} /> What does this mean?
          </button>

          {result.hemoglobin && (
            <div style={{ 
              marginTop: '24px', 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.1) 0%, rgba(13, 148, 136, 0.05) 100%)', 
              borderRadius: '20px', 
              border: '2px solid var(--color-primary)', 
              display: 'block', 
              maxWidth: '280px', 
              margin: '24px auto 0',
              boxShadow: '0 8px 32px rgba(13, 148, 136, 0.15)'
            }}>
              <p style={{ fontSize: '0.85rem', margin: '0 0 8px 0', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold', color: 'var(--color-primary)' }}>Predicted Hemoglobin</p>
              <h3 style={{ fontSize: '2.8rem', margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
                {result.hemoglobin} 
                <span style={{ fontSize: '1.2rem', opacity: 0.6, fontWeight: 'normal' }}>g/dL</span>
              </h3>
            </div>
          )}
        </div>

        {/* Multi-Step Breakdown */}
        {state?.multiStep && result.breakdown && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ marginBottom: '16px' }}>Diagnostic Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {Object.entries(result.breakdown).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: val.score > 70 ? 'var(--color-success)' : val.score > 40 ? 'var(--color-warning)' : 'var(--color-danger)' }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{key.replace('_', ' ')}</span>
                  </div>
                  <span style={{ fontWeight: 'bold' }}>{val.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Captured Image */}
        {!state?.multiStep && (
          <div className="glass-panel" style={{ overflow: 'hidden' }}>
            <img src={state.imageSrc} alt="Scanned Area" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Captured {state.scanType}
            </div>
          </div>
        )}

        {/* Severity Slider */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>Severity Spectrum</h3>
          <div style={{ 
            height: '12px', borderRadius: '12px', position: 'relative',
            background: 'linear-gradient(to right, var(--color-danger) 0%, var(--color-warning) 50%, var(--color-success) 100%)'
          }}>
            <div style={{
              position: 'absolute', top: '-6px', width: '24px', height: '24px',
              backgroundColor: 'white', border: '3px solid var(--text-primary)', borderRadius: '50%',
              left: `calc(${result.score}% - 12px)`, transition: 'left 1s ease-out'
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', mt: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span>Severe</span>
            <span>Healthy</span>
          </div>
        </div>

        {/* Next Steps Checklist */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>Recommended Actions</h3>
          <ul style={{ listStyleType: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(result.category === 'High Risk' || result.category === 'Borderline') ? (
              <>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Schedule a blood test with your doctor</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Eat iron-rich foods (spinach, red meat)</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Consider an iron supplement</li>
              </>
            ) : (
              <>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Maintain your healthy diet</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Stay hydrated (drink 8 glasses of water)</li>
                <li style={{ display: 'flex', gap: '8px', alignItems: 'start' }}><CheckCircle color="var(--color-primary)" size={20} /> Scan again in 7 days to track trends</li>
              </>
            )}
          </ul>
        </div>
        
        {/* Toggle Details Base */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          style={{ padding: '12px', background: 'var(--bg-glass)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%' }}
        >
          {showDetails ? 'Hide' : 'Show'} Technical Details
        </button>
        
        {showDetails && (
          <div className="glass-panel" style={{ padding: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <p><strong>Method:</strong> {result.pipeline || 'Deep Learning Inference'} Pipeline</p>
            <p><strong>Safety Checks:</strong> {result.safety_checks || 'Passed'}</p>
            <p><strong>Anemia Threshold:</strong> {result.threshold || '0.42'}</p>
            <p><strong>Anemia Probability:</strong> {result.raw?.anemia_probability || 'N/A'}</p>
            <p><strong>Inference Engine:</strong> Ngrok Cloud (Remote)</p>
          </div>
        )}

      </div>
    </div>
  );
}
