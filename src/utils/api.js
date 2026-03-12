/**
 * Utility for communicating with the local analysis API.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Default local analysis server

export async function submitDiagnosticData(data) {
  const formData = new FormData();

  // data will contain: { video: Blob, nailsAll: Blob, nailCloseup: Blob, palm: Blob, eye: Blob }
  if (data.video) formData.append('video', data.video, 'fist_video.webm');
  if (data.nailsAll) formData.append('nails_all', data.nailsAll, 'nails_all.jpg');
  if (data.nailCloseup) formData.append('nail_closeup', data.nailCloseup, 'nail_closeup.jpg');
  if (data.palm) formData.append('palm', data.palm, 'palm.jpg');
  if (data.eye) formData.append('eye', data.eye, 'eye.jpg');

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to submit diagnostic data:", error);
    throw error;
  }
}
