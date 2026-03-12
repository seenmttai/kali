import { useState, useEffect } from 'react';
import { 
  Activity, Droplets, Coffee, Citrus, Bed, Smile, 
  Wind, ThermometerSnowflake, Plus, Check, AlertTriangle
} from 'lucide-react';
import LottiePlayer from '../components/common/LottiePlayer';
import { get, set } from 'idb-keyval';

export default function SymptomsPage() {
  const [log, setLog] = useState({
    date: new Date().toISOString().split('T')[0],
    fatigue: 5,
    symptoms: [],
    ironPill: false,
    menstrual: false,
    diet: [],
    caffeine: 0,
    vitaminC: false,
    water: 4,
    sleep: 7,
    mood: 'neutral',
    customNotes: ''
  });

  const [savedToday, setSavedToday] = useState(false);

  useEffect(() => {
    loadTodayLog();
  }, []);

  const loadTodayLog = async () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const logs = await get('symptom-logs') || {};
    if (logs[todayStr]) {
      setLog(logs[todayStr]);
      setSavedToday(true);
    }
  };

  const handleSave = async () => {
    const logs = await get('symptom-logs') || {};
    logs[log.date] = log;
    await set('symptom-logs', logs);
    setSavedToday(true);
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const toggleArrayItem = (field, item) => {
    setLog(prev => {
      const arr = prev[field];
      if (arr.includes(item)) {
        return { ...prev, [field]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [field]: [...arr, item] };
      }
    });
    setSavedToday(false);
  };

  const toggleBool = (field) => {
    setLog(prev => ({ ...prev, [field]: !prev[field] }));
    setSavedToday(false);
  };

  const updateValue = (field, val) => {
    setLog(prev => ({ ...prev, [field]: val }));
    setSavedToday(false);
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '100px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'var(--color-primary-dark)', padding: '30px 20px', borderRadius: '0 0 30px 30px', color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: '-10px', top: '10px', width: '120px', height: '120px', opacity: 0.4 }}>
          <LottiePlayer src="https://lottie.host/7e29d8b1-4c17-4f65-9856-11f269a896d7/p6f3o8ve0e.json" />
        </div>
        <div style={{ zIndex: 1 }}>
          <h2 style={{ margin: 0, color: 'white' }}>Daily Log</h2>
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Fatigue Slider */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={20} color="var(--color-primary)" /> Fatigue Level</h3>
            <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{log.fatigue}/10</span>
          </div>
          <input 
            type="range" min="1" max="10" value={log.fatigue} 
            onChange={e => updateValue('fatigue', parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span>Energized</span>
            <span>Exhausted</span>
          </div>
        </div>

        {/* Symptoms Checklist */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Symptoms Today</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {[
              { id: 'dizzy', label: 'Dizziness', icon: Wind },
              { id: 'short_breath', label: 'Short Breath', icon: Activity },
              { id: 'cold_hands', label: 'Cold Hands', icon: ThermometerSnowflake },
              { id: 'headache', label: 'Headache', icon: AlertTriangle }
            ].map(sym => (
              <button 
                key={sym.id}
                onClick={() => toggleArrayItem('symptoms', sym.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 16px', borderRadius: '20px',
                  background: log.symptoms.includes(sym.id) ? 'var(--color-primary)' : 'var(--bg-card)',
                  color: log.symptoms.includes(sym.id) ? 'white' : 'var(--text-primary)',
                  border: '1px solid var(--border-color)', transition: 'all 0.2s'
                }}
              >
                <sym.icon size={16} /> {sym.label}
              </button>
            ))}
          </div>
          <input 
            type="text" placeholder="Other symptoms..." 
            value={log.customNotes}
            onChange={e => updateValue('customNotes', e.target.value)}
            style={{
              width: '100%', marginTop: '16px', padding: '12px',
              borderRadius: '8px', border: '1px solid var(--border-color)',
              background: 'var(--bg-app)', color: 'var(--text-primary)'
            }}
          />
        </div>

        {/* Lifestyle / Diet Toggles */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Lifestyle & Diet</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            
            <button 
              onClick={() => toggleBool('ironPill')}
              style={{
                padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: log.ironPill ? 'rgba(13, 148, 136, 0.1)' : 'var(--bg-card)',
                border: `2px solid ${log.ironPill ? 'var(--color-primary)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)'
              }}
            >
              <Plus size={24} color={log.ironPill ? "var(--color-primary)" : "var(--text-muted)"} />
              <span style={{ fontSize: '0.85rem' }}>Iron Pill</span>
            </button>

            <button 
              onClick={() => toggleBool('vitaminC')}
              style={{
                padding: '12px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: log.vitaminC ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)',
                border: `2px solid ${log.vitaminC ? 'var(--color-warning)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)'
              }}
            >
              <Citrus size={24} color={log.vitaminC ? "var(--color-warning)" : "var(--text-muted)"} />
              <span style={{ fontSize: '0.85rem' }}>Vitamin C</span>
            </button>

          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Coffee size={20} color="#8B4513" /> Caffeine (Cups)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => updateValue('caffeine', Math.max(0, log.caffeine - 1))} style={{ padding: '4px 12px', background: 'var(--border-color)', borderRadius: '8px' }}>-</button>
              <span style={{ fontWeight: 'bold' }}>{log.caffeine}</span>
              <button onClick={() => updateValue('caffeine', log.caffeine + 1)} style={{ padding: '4px 12px', background: 'var(--border-color)', borderRadius: '8px' }}>+</button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', padding: '12px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Droplets size={20} color="#0ea5e9" /> Water (Glasses)</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button onClick={() => updateValue('water', Math.max(0, log.water - 1))} style={{ padding: '4px 12px', background: 'var(--border-color)', borderRadius: '8px' }}>-</button>
              <span style={{ fontWeight: 'bold' }}>{log.water}</span>
              <button onClick={() => updateValue('water', log.water + 1)} style={{ padding: '4px 12px', background: 'var(--border-color)', borderRadius: '8px' }}>+</button>
            </div>
          </div>

        </div>

      </div>

      <button 
        onClick={handleSave}
        style={{
          position: 'fixed', bottom: '90px', left: '20px', right: '20px',
          padding: '16px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 'bold',
          background: savedToday ? 'var(--color-success)' : 'var(--color-primary)',
          color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', zIndex: 10,
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)', transition: 'background 0.3s'
        }}
      >
        {savedToday ? <><Check size={20} /> Log Saved</> : 'Save Daily Log'}
      </button>

    </div>
  );
}
