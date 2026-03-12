import { get, set, clear } from 'idb-keyval';

export async function saveScanResult(result) {
  try {
    const history = (await get('scan-history')) || [];
    // Ensure we have a unique ID
    const newRecord = { ...result, id: Date.now() };
    const newHistory = [newRecord, ...history];
    await set('scan-history', newHistory);
    return newHistory;
  } catch (error) {
    console.error("Failed to save scan result", error);
    return [];
  }
}

export async function getScanHistory() {
  try {
    return (await get('scan-history')) || [];
  } catch (error) {
    console.error("Failed to get scan history", error);
    return [];
  }
}

export async function clearHistory() {
  try {
    await clear();
    return true;
  } catch (error) {
    console.error("Failed to clear history", error);
    return false;
  }
}

export async function addNoteToScan(id, note) {
  try {
    const history = (await get('scan-history')) || [];
    const idx = history.findIndex(h => h.id === id);
    if (idx !== -1) {
      history[idx].note = note;
      await set('scan-history', history);
    }
    return history;
  } catch (error) {
    console.error("Failed to add note", error);
  }
}

export async function deleteScan(id) {
  try {
    const history = (await get('scan-history')) || [];
    const newHistory = history.filter(h => h.id !== id);
    await set('scan-history', newHistory);
    return newHistory;
  } catch (error) {
    console.error("Failed to delete scan", error);
  }
}
