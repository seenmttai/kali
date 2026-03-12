export function exportHistoryToCSV(historyData) {
  if (!historyData || historyData.length === 0) return;

  const headers = ['Date', 'Time', 'Type', 'Score', 'Category', 'Confidence', 'Notes'];
  
  const rows = historyData.map(item => {
    const d = new Date(item.date);
    return [
      d.toLocaleDateString(),
      d.toLocaleTimeString(),
      item.scanType || 'unknown',
      item.score,
      item.category,
      item.confidence,
      `"${(item.note || '').replace(/"/g, '""')}"` // Escape quotes
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kali_scans_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
