import { Outlet } from 'react-router-dom';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import FAB from './FAB';

export default function AppShell() {
  return (
    <div className="app-container">
      <TopBar />
      <main style={{ 
        flex: 1, 
        marginTop: '60px', 
        marginBottom: '70px', 
        overflowY: 'auto',
        position: 'relative'
      }}>
        <Outlet />
      </main>
      <FAB />
      <BottomNav />
    </div>
  );
}
