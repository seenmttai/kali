import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScanHistory } from '../utils/storage';
import { 
  Activity, Clock, BookOpen, ChevronRight, Apple, Zap
} from 'lucide-react';

const QUOTES = [
  "Your health is your true wealth.",
  "Iron-rich foods are the building blocks of energy.",
  "Small daily habits make a big difference.",
  "Stay hydrated, stay energized.",
  "Listen to your body when it asks for rest."
];

import LottiePlayer from '../components/common/LottiePlayer';

export default function HomePage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [quote] = useState(QUOTES[Math.floor(Math.random() * QUOTES.length)]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  const latestScan = history.length > 0 ? history[0] : null;

  // Calculate days since last scan
  let daysSince = null;
  if (latestScan) {
    const diffTime = Math.abs(Date.now() - new Date(latestScan.date).getTime());
    daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate weekly average
  const lastWeekScans = history.filter(h => {
    const diffTime = Math.abs(Date.now() - new Date(h.date).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) <= 7;
  });
  
  const avgScore = lastWeekScans.length > 0 
    ? Math.round(lastWeekScans.reduce((acc, curr) => acc + curr.score, 0) / lastWeekScans.length)
    : null;

  return (
    <div style={{ padding: '0 0 100px 0', backgroundColor: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Top Graphic / Greeting */}
      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
        padding: '40px 20px 50px',
        borderBottomLeftRadius: '40px',
        borderBottomRightRadius: '40px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Background Lottie */}
        <div style={{ position: 'absolute', right: '-20px', top: '20px', width: '150px', height: '150px', opacity: 0.3, pointerEvents: 'none' }}>
          <LottiePlayer src="https://lottie.host/76fa4d5c-3f5f-4d6d-9b5d-e0e6e789d6e7/p6f3o8ve0e.json" />
        </div>


        <p style={{ opacity: 0.8, margin: '0 0 4px', fontSize: '0.9rem' }}>Good {new Date().getHours() < 12 ? 'Morning' : 'Evening'},</p>
        <h1 style={{ margin: 0, fontSize: '1.8rem' }}>Ready for a checkup?</h1>
        
        {/* Quote Banner */}
        <div style={{ 
          marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.15)', 
          borderRadius: '16px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', gap: '12px'
        }}>
          <Zap size={20} color="#F59E0B" flexShrink={0} />
          <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.4, fontStyle: 'italic' }}>"{quote}"</p>
        </div>
      </div>

      <div style={{ padding: '20px', marginTop: '-20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Status Card */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {latestScan ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>Latest Scan</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {daysSince === 0 ? 'Today' : `${daysSince} days ago`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '60px', height: '60px', borderRadius: '50%', 
                  background: latestScan.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 'bold', fontSize: '1.2rem',
                  boxShadow: `0 0 15px ${latestScan.color}40`
                }}>
                  {latestScan.score}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: latestScan.color }}>{latestScan.category}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on {latestScan.scanType} analysis</div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '10px' }}>
              <div style={{ width: '50px', height: '50px', background: 'var(--border-color)', borderRadius: '50%', margin: '0 auto 10px' }} />
              <h3 style={{ margin: '0 0 8px' }}>No Scans Yet</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>Tap the camera icon below to take your first scan!</p>
            </div>
          )}
        </div>

        {/* Weekly Avg */}
        {avgScore !== null && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className="glass-panel" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={14} /> 7-Day Average
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '8px' }}>{avgScore}<span style={{fontSize:'1rem', color:'var(--text-muted)'}}>/100</span></div>
            </div>
            <div className="glass-panel" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(249, 112, 102, 0.1)', borderColor: 'rgba(249, 112, 102, 0.3)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Streak
              </span>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginTop: '8px', color: 'var(--color-accent)' }}>{lastWeekScans.length} <span style={{fontSize:'1rem', color:'var(--text-muted)'}}>days</span></div>
            </div>
          </div>
        )}

        {/* Quick Links */}
        <h3 style={{ margin: '10px 0 0 0', fontSize: '1.1rem' }}>Quick Actions</h3>
        
        <button 
          onClick={() => navigate('/education')}
          className="glass-panel" 
          style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', borderLeft: '4px solid var(--color-secondary)' }}
        >
          <div style={{ padding: '10px', background: 'rgba(14, 165, 233, 0.1)', borderRadius: '12px', color: 'var(--color-secondary)' }}><BookOpen size={24} /></div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>Education Hub</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Learn about anemia basics and diet</p>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

        <button 
          onClick={() => navigate('/symptoms')}
          className="glass-panel" 
          style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left', borderLeft: '4px solid var(--color-success)' }}
        >
          <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', color: 'var(--color-success)' }}><Apple size={24} /></div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0 }}>Log Symptoms</h4>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Track your daily diet and feelings</p>
          </div>
          <ChevronRight size={20} color="var(--text-muted)" />
        </button>

      </div>
    </div>
  );
}
