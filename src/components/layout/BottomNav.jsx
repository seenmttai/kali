import { NavLink } from 'react-router-dom';
import { Home, Clock, Activity, BookOpen, User } from 'lucide-react';

export default function BottomNav() {
  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/history', icon: Clock, label: 'History' },
    { to: '/camera', icon: null, label: 'Scan', isSpacer: true }, // Spacer for FAB
    { to: '/symptoms', icon: Activity, label: 'Symptoms' },
    // { to: '/education', icon: BookOpen, label: 'Learn' }, // Maybe put learning in home or profile to keep 5 tabs
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '70px',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)', // for iOS
      zIndex: 'var(--z-nav)',
      boxShadow: '0 -4px 6px -1px rgb(0 0 0 / 0.05)'
    }}>
      {navItems.map((item, idx) => {
        if (item.isSpacer) {
          return <div key={idx} style={{ width: '60px' }} aria-hidden />;
        }
        return (
          <NavLink 
            key={item.to} 
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              color: isActive ? 'var(--color-primary)' : 'var(--text-muted)',
              flex: 1,
              height: '100%',
              transition: 'color 0.2s',
              WebkitTapHighlightColor: 'transparent'
            })}
          >
            <item.icon size={24} strokeWidth={2.5} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
