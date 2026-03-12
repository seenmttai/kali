import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateDoctorReport } from '../utils/pdfGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { 
  FileText, Share2, Phone, Mail, FileOutput, ArrowLeft,
  AlertTriangle, Stethoscope, FileQuestion
} from 'lucide-react';

export default function DoctorPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState('');
  const [doctorMode, setDoctorMode] = useState(false);

  const handleExportPDF = async () => {
    // Generate and download
    await generateDoctorReport("Kali User");
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kali Health Report',
          text: 'My recent anemia screening history from Kali App.',
          url: window.location.href // Placeholder for hosted link if backend existed
        });
      } catch (err) {
        console.error("Error sharing", err);
      }
    } else {
      alert("Web Share API not supported on this device/browser.");
    }
  };

  return (
    <div style={{ paddingBottom: '100px', backgroundColor: doctorMode ? '#f8fafc' : 'var(--bg-app)', minHeight: '100vh', transition: 'background 0.3s' }}>
      
      {/* Header */}
      <div style={{ background: doctorMode ? '#0f172a' : 'var(--color-primary)', color: 'white', padding: '40px 20px 20px', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', transition: 'background 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <button onClick={() => navigate(-1)} style={{ color: 'white', background: 'rgba(255,255,255,0.2)', padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={24} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '20px' }}>
            <span style={{ fontSize: '0.8rem' }}>Clinical View</span>
            <input 
              type="checkbox" 
              checked={doctorMode} 
              onChange={() => setDoctorMode(!doctorMode)} 
              title="Toggle Doctor Mode" 
              style={{ width: '40px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-accent)' }} 
            />
          </div>
        </div>
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ margin: 0 }}>Doctor Portal</h1>
          <p style={{ margin: 0, opacity: 0.8 }}>Share data with your physician</p>
        </div>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Export Actions */}
        <section>
          <h2 style={{ fontSize: '1.2rem', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileOutput size={20} color={doctorMode ? '#0f172a' : 'var(--color-primary)'} /> Export Data</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '12px' }}>
            <button 
              onClick={handleExportPDF}
              className="glass-panel" 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', border: doctorMode ? '1px solid #cbd5e1' : 'none', color: doctorMode ? '#0f172a' : 'var(--text-primary)' }}
            >
              <FileText size={32} color={doctorMode ? "#334155" : "var(--color-secondary)"} />
              <span style={{ fontWeight: 'bold' }}>Generate PDF</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>30-Day Summary</span>
            </button>

            <button 
              onClick={shareReport}
              className="glass-panel" 
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '20px', border: doctorMode ? '1px solid #cbd5e1' : 'none', color: doctorMode ? '#0f172a' : 'var(--text-primary)' }}
            >
              <Share2 size={32} color={doctorMode ? "#334155" : "var(--color-success)"} />
              <span style={{ fontWeight: 'bold' }}>Share Link</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Via Native Share</span>
            </button>
          </div>
        </section>

        {/* QR Code Hand-off */}
        <section className="glass-panel" style={{ padding: '20px', textAlign: 'center', border: doctorMode ? '1px solid #cbd5e1' : 'none' }}>
          <h3 style={{ margin: '0 0 16px' }}>Quick Scan Transfer</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Let your doctor scan this code to load a temporary, anonymized report on their device.</p>
          <div style={{ background: 'white', padding: '16px', borderRadius: '12px', display: 'inline-block' }}>
            {/* Note: In a real app this would point to a secure backend route. For PWA, it's a stub URL. */}
            <QRCodeSVG value="https://kalimedical.app/shared-report/demo-12345" size={150} />
          </div>
        </section>

        {/* Doctor Contact */}
        <section className="glass-panel" style={{ padding: '20px', border: doctorMode ? '1px solid #cbd5e1' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}><Stethoscope size={20} color="var(--color-primary)" /> Primary Care</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>Edit</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '50px', height: '50px', background: 'var(--border-color)', borderRadius: '50%' }} />
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>Dr. Sarah Smith</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hematology Clinic</p>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <a href="tel:5551234567" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'var(--color-primary)', color: 'white', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
              <Phone size={18} /> Call
            </a>
            <a href="mailto:doctor@clinic.com" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold' }}>
              <Mail size={18} /> Email
            </a>
          </div>
        </section>

        {/* Questions Notepad */}
        <section className="glass-panel" style={{ padding: '20px', border: doctorMode ? '1px solid #cbd5e1' : 'none' }}>
          <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><FileQuestion size={20} color="var(--color-primary)" /> Questions for Next Visit</h3>
          <textarea 
            placeholder="E.g. Should I increase my iron dose? Why do I still feel fatigued?"
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            style={{ 
              width: '100%', height: '100px', padding: '12px', borderRadius: '12px', 
              border: '1px solid var(--border-color)', background: 'var(--bg-app)', 
              color: 'var(--text-primary)', resize: 'vertical' 
            }}
          />
        </section>

        {/* Lab Reference */}
        {doctorMode && (
          <section className="glass-panel" style={{ padding: '20px', border: '1px solid #cbd5e1' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}><AlertTriangle size={20} color="gray" /> Lab Reference Ranges</h3>
            <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 0', color: '#64748b' }}>Metric</th>
                  <th style={{ padding: '8px 0', color: '#64748b' }}>Male</th>
                  <th style={{ padding: '8px 0', color: '#64748b' }}>Female</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', color: '#334155' }}>Hemoglobin (g/dL)</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>13.8 - 17.2</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>12.1 - 15.1</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px 0', color: '#334155' }}>Hematocrit (%)</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>40.7 - 50.3</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>36.1 - 44.3</td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0', color: '#334155' }}>Serum Iron (mcg/dL)</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>65 - 176</td>
                  <td style={{ padding: '8px 0', color: '#334155' }}>50 - 170</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

      </div>
    </div>
  );
}
