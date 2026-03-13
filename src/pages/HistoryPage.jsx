import { useState, useEffect } from 'react';
import { 
  getScanHistory, deleteScan, addNoteToScan 
} from '../utils/storage';
import { exportHistoryToCSV } from '../utils/csvExport';
import { 
  Calendar as CalendarIcon, TrendingUp, List as ListIcon, 
  Trash2, Download, Filter, Star
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import gsap from 'gsap';
import magnifyingGlassIcon from '../assets/icons/4.svg';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
);

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'chart', 'calendar'
  const [filter, setFilter] = useState('all'); // 'all', 'Normal', 'Borderline', 'High Risk'

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const data = await getScanHistory();
    setHistory(data);
  };

  const handleDelete = async (id) => {
    // Quick GSAP animate out could go here
    const newHistory = await deleteScan(id);
    setHistory(newHistory);
  };

  const handleNoteChange = async (id, text) => {
    const newHistory = await addNoteToScan(id, text);
    if(newHistory) setHistory(newHistory);
  };

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.category === filter;
  });

  // Chart config
  const chartData = {
    // Reverse so newest is on right
    labels: filteredHistory.map(h => new Date(h.date).toLocaleDateString()).reverse(),
    datasets: [
      {
        label: 'Paleness Score',
        data: filteredHistory.map(h => h.score).reverse(),
        borderColor: 'var(--color-primary)',
        backgroundColor: 'rgba(13, 148, 136, 0.5)',
        tension: 0.3,
        pointRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: { min: 0, max: 100 }
    },
    plugins: {
      legend: { display: false }
    }
  };

  return (
    <div style={{ padding: '20px', paddingBottom: '80px', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>Scan History</h2>
        <button onClick={() => exportHistoryToCSV(history)} style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}>
          <Download size={18} /> CSV
        </button>
      </div>

      {/* View Toggles */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', background: 'var(--border-color)', padding: '4px', borderRadius: '12px' }}>
        <button 
          onClick={() => setViewMode('list')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: viewMode === 'list' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          <ListIcon size={20} style={{ margin: '0 auto' }} />
        </button>
        <button 
          onClick={() => setViewMode('chart')}
          style={{ flex: 1, padding: '8px', borderRadius: '8px', background: viewMode === 'chart' ? 'var(--bg-card)' : 'transparent', color: viewMode === 'chart' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          <TrendingUp size={20} style={{ margin: '0 auto' }} />
        </button>
      </div>

      {/* Filters (only in list view) */}
      {viewMode === 'list' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
          {['all', 'Normal', 'Borderline', 'High Risk'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '6px 12px', borderRadius: '20px', whiteSpace: 'nowrap', fontSize: '0.85rem',
              background: filter === f ? 'var(--color-primary)' : 'var(--bg-card)',
              color: filter === f ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border-color)'
            }}>
              {f === 'all' ? 'All Results' : f}
            </button>
          ))}
        </div>
      )}

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <img src={magnifyingGlassIcon} alt="No scans" style={{ width: '100%', height: '100%' }} />
          </div>
          <h3 style={{ marginTop: '0px' }}>No Scans Yet</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Your history will appear here once you take your first medical scan.</p>
        </div>
      ) : (
        <>
          {viewMode === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredHistory.map(item => (
                <div key={item.id} className="glass-panel" style={{ padding: '16px', display: 'flex', gap: '16px', position: 'relative', overflow: 'hidden' }}>
                  {/* Thumbnail */}
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                    {item.imageSrc ? (
                      <img src={item.imageSrc} alt="Scan thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                    )}
                  </div>
                  
                  {/* Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h4 style={{ margin: '0 0 4px' }}>{item.category} ({item.score}%)</h4>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(item.date).toLocaleDateString([], { month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Type: <span style={{ textTransform: 'capitalize' }}>{item.scanType}</span></div>
                    
                    {/* Inline Note Editor */}
                    <input 
                      type="text" 
                      placeholder="Add an optional note..."
                      value={item.note || ''}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      style={{ 
                        width: '100%', marginTop: '8px', padding: '4px 0', border: 'none', 
                        borderBottom: '1px solid var(--border-color)', background: 'transparent',
                        fontSize: '0.85rem', color: 'var(--text-primary)', outline: 'none'
                      }}
                    />
                  </div>

                  {/* Delete Button overlaid on right side */}
                  <button 
                    onClick={() => handleDelete(item.id)}
                    style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--color-danger)', padding: '4px' }}
                    aria-label="Delete scan"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {viewMode === 'chart' && (
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ marginBottom: '20px' }}>30-Day Trend</h3>
              <div style={{ height: '300px' }}>
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
}
