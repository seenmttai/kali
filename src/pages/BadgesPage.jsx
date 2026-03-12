import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Award, Star, Zap, Droplets, Target, Shield, CheckCircle, Lock, ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import LottiePlayer from '../components/common/LottiePlayer';

const BADGES = [
  { id: 1, title: 'First Scan', icon: Shield, color: '#10B981', desc: 'Completed your very first scan', unlocked: true },
  { id: 2, title: '7-Day Streak', icon: Zap, color: '#F59E0B', desc: 'Logged symptoms 7 days in a row', unlocked: true },
  { id: 3, title: 'Hydration Hero', icon: Droplets, color: '#3B82F6', desc: 'Drank 8+ glasses 5 days in a row', unlocked: false },
  { id: 4, title: 'Iron Clad', icon: Target, color: '#EF4444', desc: 'Ate iron-rich foods 3 days in a row', unlocked: false },
  { id: 5, title: 'Night Owl', icon: Star, color: '#8B5CF6', desc: 'Slept 8 hours', unlocked: true },
  { id: 6, title: 'Healthy Blood', icon: CheckCircle, color: '#14B8A6', desc: 'Scored Normal 3 times', unlocked: false }
];

export default function BadgesPage() {
  const navigate = useNavigate();
  const [selectedBadge, setSelectedBadge] = useState(null);

  const handleBadgeClick = (badge) => {
    setSelectedBadge(badge);
    if (badge.unlocked) {
      confetti({
        particleCount: 50,
        spread: 40,
        origin: { y: 0.6 },
        colors: [badge.color, '#ffffff']
      });
    }
  };

  const unlockedCount = BADGES.filter(b => b.unlocked).length;

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: 'var(--color-primary-dark)', color: 'white', padding: '40px 20px 30px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '20px', width: '150px', height: '150px', opacity: 0.3 }}>
          <LottiePlayer src="https://lottie.host/d6874e50-9831-4c31-9878-cfdf20202d08/success-celebration.json" />
        </div>
        
        <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%', width: 'fit-content', zIndex: 1 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
          <div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}><Award size={28} /> My Rewards</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>You've earned {unlockedCount} of {BADGES.length} badges</p>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
            {Math.round((unlockedCount / BADGES.length) * 100)}<span style={{ fontSize: '1.2rem', opacity: 0.7 }}>%</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* Progress Bar */}
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 'bold' }}>
            <span>Level 3 Tracker</span>
            <span style={{ color: 'var(--color-primary)' }}>150 XP to Level 4</span>
          </div>
          <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: 'var(--color-primary)' }} />
          </div>
        </div>

        {/* Badge Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '16px' }}>
          {BADGES.map((badge, idx) => (
            <button 
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              style={{
                background: 'var(--bg-card)', 
                border: selectedBadge?.id === badge.id ? `2px solid ${badge.unlocked ? badge.color : 'var(--text-muted)'}` : '1px solid var(--border-color)', 
                borderRadius: '16px', padding: '16px 8px', 
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                opacity: badge.unlocked ? 1 : 0.5,
                transition: 'transform 0.2s', transform: selectedBadge?.id === badge.id ? 'scale(1.05)' : 'scale(1)'
              }}
            >
              <div style={{ 
                width: '60px', height: '60px', borderRadius: '50%', 
                background: badge.unlocked ? `${badge.color}20` : 'var(--border-color)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: badge.unlocked ? badge.color : 'var(--text-muted)'
              }}>
                {badge.unlocked ? <badge.icon size={32} /> : <Lock size={24} />}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 'bold', textAlign: 'center' }}>{badge.title}</span>
            </button>
          ))}
        </div>

        {/* Selected Badge Details */}
        {selectedBadge && (
          <div 
            className="glass-panel" 
            style={{ 
              marginTop: '24px', padding: '20px', display: 'flex', gap: '16px', alignItems: 'center',
              borderLeft: `4px solid ${selectedBadge.unlocked ? selectedBadge.color : 'var(--text-muted)'}`
            }}
          >
            <div style={{ 
              width: '50px', height: '50px', borderRadius: '50%', 
              background: selectedBadge.unlocked ? `${selectedBadge.color}20` : 'var(--border-color)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: selectedBadge.unlocked ? selectedBadge.color : 'var(--text-muted)'
            }}>
              {selectedBadge.unlocked ? <selectedBadge.icon size={24} /> : <Lock size={24} />}
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem' }}>{selectedBadge.title} {selectedBadge.unlocked ? '✨' : ''}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{selectedBadge.desc}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
