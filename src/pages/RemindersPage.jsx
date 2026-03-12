import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Clock, Calendar, CheckCircle, ArrowLeft, Plus, Settings
} from 'lucide-react';

export default function RemindersPage() {
  const navigate = useNavigate();
  const [reminders, setReminders] = useState([
    { id: 1, type: 'scan', title: 'Time for your weekly scan', time: '09:00 AM', days: ['Mon'], active: true },
    { id: 2, type: 'pill', title: 'Take Iron Supplement', time: '08:00 AM', days: ['Everyday'], active: true },
    { id: 3, type: 'water', title: 'Hydration Check', time: 'Every 2 hours', days: ['Everyday'], active: false }
  ]);
  
  const [notifications] = useState([
    { id: 101, title: '7-Day Streak Achieved!', desc: 'You have logged your symptoms every day this week.', time: '2 hours ago', unread: true },
    { id: 102, title: 'Scan Result Normal', desc: 'Your latest eye scan shows healthy hemoglobin levels.', time: 'Yesterday', unread: false },
    { id: 103, title: 'Weekly Report Ready', desc: 'Check out your health trends for the past week.', time: '2 days ago', unread: false }
  ]);

  const toggleReminder = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        new Notification('Alerts Enabled', { body: 'You will now receive Kali reminders.' });
      } else {
        alert("Please enable notifications in your browser settings.");
      }
    }
  };

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: 'var(--bg-app)', minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* Header */}
      <div style={{ background: 'var(--color-primary)', color: 'white', padding: '40px 20px 20px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={24} />
          </button>
          <button style={{ color: 'white', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '50%' }}>
            <Settings size={24} />
          </button>
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Alerts & Inbox</h1>
          <button onClick={requestPermission} style={{ marginTop: '8px', padding: '6px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '0.8rem', color: 'white', border: 'none' }}>
            Enable Push Notifications
          </button>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Scheduled Reminders */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={20} color="var(--color-primary)" /> Scheduled</h2>
            <button style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', padding: '4px 8px' }}><Plus size={16} /> New</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reminders.map(rem => (
              <div key={rem.id} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: rem.active ? 1 : 0.6 }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{rem.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
                    <span>{rem.time}</span> • <span>{rem.days.join(', ')}</span>
                  </div>
                </div>
                {/* Custom Toggle Switch */}
                <div 
                  onClick={() => toggleReminder(rem.id)}
                  style={{ 
                    width: '50px', height: '28px', background: rem.active ? 'var(--color-success)' : 'var(--border-color)', 
                    borderRadius: '20px', position: 'relative', cursor: 'pointer', transition: '0.3s' 
                  }}
                >
                  <div style={{
                    width: '24px', height: '24px', background: 'white', borderRadius: '50%',
                    position: 'absolute', top: '2px', left: rem.active ? '24px' : '2px', transition: '0.3s',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inbox */}
        <section>
          <h2 style={{ margin: '0 0 16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}><Bell size={20} color="var(--color-primary)" />Inbox</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
            {notifications.map(notif => (
              <div key={notif.id} style={{ padding: '16px', background: notif.unread ? 'var(--color-primary-light)' : 'var(--bg-card)', display: 'flex', gap: '12px' }}>
                <div style={{ marginTop: '4px' }}>
                  {notif.unread ? <div style={{ width: '10px', height: '10px', background: 'var(--color-primary)', borderRadius: '50%' }} /> : <CheckCircle size={16} color="var(--text-muted)" />}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: notif.unread ? 'var(--color-primary)' : 'var(--text-primary)' }}>{notif.title}</h4>
                  <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{notif.desc}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{notif.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
