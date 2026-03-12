import Lottie from 'lottie-react';
import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, Calendar, Award } from 'lucide-react';

/**
 * A flexible Lottie player that gracefully falls back to premium CSS animations 
 * if remote Lottie files are blocked by CORS/403.
 */
export default function LottiePlayer({ src, animationData, loop = true, autoplay = true, style = {} }) {
  const [data, setData] = useState(animationData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (src && !animationData) {
      // Pre-emptively block lottie.host URLs to avoid console 403 spam
      if (src.includes('lottie.host')) {
        console.warn("Lottie.host is blocked. Using premium fallback for:", src);
        setError(true);
        return;
      }

      fetch(src)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch lottie');
          return res.json();
        })
        .then(json => setData(json))
        .catch(err => {
          console.error("Lottie fetch failed. Using premium fallback:", err);
          setError(true);
        });
    }
  }, [src, animationData]);

  // Premium CSS Component Fallbacks based on URL hint
  if (error || (!data && !animationData && src)) {
    const isPulse = src?.includes('p6f3o8ve0e');
    const isScanner = src?.includes('8vWc6p87kY');
    const isTrophy = src?.includes('success-celebration');
    const isEmpty = src?.includes('rU4Qscu1kY');

    if (isPulse) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Activity size={style.width ? parseInt(style.width)/2 : 50} color="var(--color-primary)" className="animate-pulse-soft" />
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', border: '2px solid var(--color-primary)', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.2 }} />
        </div>
      );
    }

    if (isScanner) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', width: '100%', height: '100%', borderRadius: '50%', background: 'conic-gradient(from 0deg at 50% 50%, rgba(13, 148, 136, 0) 0%, rgba(13, 148, 136, 0.5) 100%)', animation: 'spin 2s linear infinite' }} />
          <ShieldCheck size={style.width ? parseInt(style.width)/2 : 50} color="var(--color-primary)" style={{ zIndex: 1 }} />
          <div style={{ position: 'absolute', width: '80%', height: '80%', borderRadius: '50%', border: '2px solid var(--color-primary)', opacity: 0.3 }} />
        </div>
      );
    }

    if (isTrophy) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Award size={style.width ? parseInt(style.width)/2 : 50} color="#F59E0B" className="animate-float" />
          <div style={{ position: 'absolute', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)', animation: 'pulse-soft 2s infinite' }} />
        </div>
      );
    }

    if (isEmpty) {
      return (
        <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Calendar size={style.width ? parseInt(style.width)/2 : 50} color="var(--text-muted)" className="animate-float" />
        </div>
      );
    }

    // Generic Spinner Fallback
    return (
      <div style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--border-color)', borderTopColor: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // If data is successfully loaded
  return (
    <Lottie 
      animationData={data} 
      loop={loop} 
      autoplay={autoplay} 
      style={style} 
    />
  );
}

