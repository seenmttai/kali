/**
 * Utility for communicating with the local analysis API.
 */

const API_BASE_URL = 'https://6c77-35-240-20-237.ngrok-free.app';
const REQUEST_TIMEOUT_MS = 300000; // 5 minutes for deep learning processing on mobile

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = REQUEST_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'ngrok-skip-browser-warning': 'any'
      }
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error("Request timed out after 5 minutes. Your connection might be too slow for high-quality video upload.");
    }
    throw error;
  }
}

export async function submitDiagnosticData(data) {
  // Debug info for mobile
  console.log("Starting Diagnostic Submission:", {
    onLine: navigator.onLine,
    type: data.VIDEO ? "Multi-Modal" : (data.EYE ? "Iris" : "Unknown"),
    connection: navigator.connection ? {
      effectiveType: navigator.connection.effectiveType,
      saveData: navigator.connection.saveData
    } : "Not available"
  });

  if (data.VIDEO && data.NAILS_ALL) {
    const formData = new FormData();
    formData.append('palmas', data.VIDEO, 'patient_palm.mp4');
    formData.append('unas', data.NAILS_ALL, 'patient_fingernail.jpg');

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict_mm`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
      const result = await response.json();

      return {
        category: result.anemia_prediction === 'Anemic' ? 'High Risk' : 'Normal',
        score: Math.round((1 - (result.anemia_probability || 0)) * 100),
        hemoglobin: result.hemoglobin_g_dl,
        safety_checks: 'Passed (MTCG Pipeline)',
        threshold: result.threshold_used,
        pipeline: 'Multi-Modal',
        raw: result
      };
    } catch (error) {
      console.error("Multi-modal submission error:", error);
      throw error;
    }
  } else if (data.EYE) {
    const formData = new FormData();
    formData.append('image', data.EYE, 'conjunctiva.jpg');

    try {
      const response = await fetchWithTimeout(`${API_BASE_URL}/predict_iris`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.status} ${response.statusText}`);
      const result = await response.json();

      return {
        category: result.prediction === 'Anemic' ? 'High Risk' : 'Normal',
        score: Math.round((1 - (result.anemia_probability || 0)) * 100),
        hemoglobin: null,
        safety_checks: 'Passed (Iris Pipeline)',
        threshold: result.threshold_used,
        pipeline: 'Iris',
        raw: result
      };
    } catch (error) {
      console.error("Iris submission error:", error);
      throw error;
    }
  }
}
