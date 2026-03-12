import { useNavigate } from 'react-router-dom';
import { Camera } from 'lucide-react';
import gsap from 'gsap';
import { useRef, useEffect } from 'react';

export default function FAB() {
  const navigate = useNavigate();
  const fabRef = useRef(null);

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(fabRef.current, 
      { scale: 0, y: 50 }, 
      { scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.5)', delay: 0.2 }
    );
  }, []);

  const handleClick = () => {
    // Micro-interaction
    gsap.to(fabRef.current, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      onComplete: () => navigate('/camera')
    });
  };

  return (
    <button
      ref={fabRef}
      onClick={handleClick}
      aria-label="Open Camera Wrapper"
      style={{
        position: 'fixed',
        bottom: '35px', // Sit perfectly over the bottom nav spacer
        left: '50%',
        transform: 'translateX(-50%)',
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-primary)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(13, 148, 136, 0.4)',
        zIndex: 'var(--z-fab)',
        border: '4px solid var(--bg-app)', // Seamless cutout effect against background
        transition: 'border-color 0.3s'
      }}
    >
      <Camera size={28} strokeWidth={2.5} />
    </button>
  );
}
