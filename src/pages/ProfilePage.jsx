import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { 
  User, Settings, Moon, Sun, Type, Eye, Palette, 
  Shield, Bell, Fingerprint, ChevronRight, Activity, Stethoscope, Award
} from 'lucide-react';
import { set, get } from 'idb-keyval';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { 
    theme, toggleTheme,
    highContrast, setHighContrast,
    colorblind, setColorblind,
    largeButtons, setLargeButtons,
    dyslexiaFont, setDyslexiaFont
  } = useContext(AppContext);

  const toggleHighContrast = () => setHighContrast(!highContrast);
  const toggleColorblindMode = () => setColorblind(!colorblind);
  const toggleLargeButtons = () => setLargeButtons(!largeButtons);
  const toggleDyslexiaFont = () => setDyslexiaFont(!dyslexiaFont);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'settings', 'medical'

  // Dummy State for Profile
  const [profile, setProfile] = useState({ name: 'Guest', age: '', gender: '' });

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--bg-app)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ background: 'var(--color-primary)', color: 'white', padding: '40px 20px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' }}>
            <User size={40} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>{profile.name}</h1>
            <p style={{ margin: 0, opacity: 0.8 }}>Kali User since 2024</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/badges')}
          style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', color: 'white', border: 'none' }}
        >
          <Award size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', padding: '20px' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--bg-card)', color: activeTab === 'profile' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('medical')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'medical' ? 'var(--color-primary)' : 'var(--bg-card)', color: activeTab === 'medical' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Medical
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', background: activeTab === 'settings' ? 'var(--color-primary)' : 'var(--bg-card)', color: activeTab === 'settings' ? 'white' : 'var(--text-primary)', border: '1px solid var(--border-color)' }}
        >
          Settings
        </button>
      </div>

      <div style={{ padding: '0 20px' }}>
        
        {activeTab === 'profile' && (
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Display Name</label>
              <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Age</label>
                <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Gender</label>
                <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button style={{ padding: '14px', borderRadius: '12px', background: 'var(--color-primary)', color: 'white', fontWeight: 'bold', marginTop: '10px' }}>Save Profile</button>
            
            {/* Doctor Portal Link */}
            <button 
              onClick={() => navigate('/doctor')}
              style={{ padding: '14px', borderRadius: '12px', background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
            >
              <Stethoscope size={20} color="var(--color-primary)" />
              Doctor Communication Portal
            </button>
          </div>
        )}

        {activeTab === 'medical' && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px' }}>Pre-existing Conditions</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>This helps Kali adjust recommendations.</p>
            
            {[
              'Iron-deficiency Anemia', 'Vitamin B12 Deficiency', 
              'Heavy Menstrual Bleeding', 'Celiac Disease', 'Gastric Ulcer'
            ].map(cond => (
              <label key={cond} style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  onChange={() => {}} // Stub for now
                  style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} 
                />
                <span>{cond}</span>
              </label>
            ))}
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Visual Settings */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={20} color="var(--color-primary)" /> Accessibility & Visual</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                <button onClick={toggleTheme} style={{ padding: '8px', background: 'var(--bg-app)', borderRadius: '50%' }}>
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>High Contrast</span>
                <input type="checkbox" checked={highContrast} onChange={toggleHighContrast} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Colorblind Safe (Blue/Orange)</span>
                <input type="checkbox" checked={colorblind} onChange={toggleColorblindMode} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)' }}>
                <span>Large Buttons</span>
                <input type="checkbox" checked={largeButtons} onChange={toggleLargeButtons} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                <span>Dyslexia Font</span>
                <input type="checkbox" checked={dyslexiaFont} onChange={toggleDyslexiaFont} style={{ width: '20px', height: '20px', accentColor: 'var(--color-primary)' }} />
              </div>
            </div>

            {/* Privacy & Security */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Shield size={20} color="var(--color-primary)" /> Privacy & Security</h3>
              
              <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', background: 'transparent' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Fingerprint size={18} /> Biometric Unlock</span>
                <ChevronRight size={18} color="var(--text-muted)" />
              </button>

              <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-color)', background: 'transparent' }}>
                <span>App PIN Lock</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Off</span>
              </button>

              <button style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', background: 'transparent' }}>
                <span style={{ color: 'var(--color-danger)' }}>Delete All Local Data</span>
                <ChevronRight size={18} color="var(--color-danger)" />
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
