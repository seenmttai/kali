import { useLocation } from 'react-router-dom';
import { Stethoscope, Droplet } from 'lucide-react';

export default function TopBar() {
  const location = useLocation();
  
  // Logic to determine title based on route...
  let title = "Kali";
  if (location.pathname === '/history') title = "History";
  if (location.pathname === '/symptoms') title = "Symptoms";
  if (location.pathname === '/education') title = "Education";
  if (location.pathname === '/profile') title = "Profile";

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      zIndex: 'var(--z-nav)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Droplet className="text-primary" style={{ color: 'var(--color-primary)' }} />
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h1>
      </div>
      <div style={{ flex: 1 }} />
      {/* Doctor mode indicator or connection status could go here */}
    </header>
  );
}
