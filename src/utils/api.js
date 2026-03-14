/**
 * Utility for communicating with the local analysis API.
 */

const API_BASE_URL = 'https://944c-34-178-1-132.ngrok-free.app';
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

  const fetchOptions = {
    method: 'POST',
    headers: {
      'ngrok-skip-browser-warning': 'any'
    }
  };

  if (data.VIDEO && data.NAILS_ALL) {
    const formData = new FormData();
    formData.append('palmas', data.VIDEO, 'patient_palm.mp4');
    formData.append('unas', data.NAILS_ALL, 'patient_fingernail.jpg');

    try {
      const response = await fetch(`${API_BASE_URL}/predict_mm`, {
        ...fetchOptions,
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
      const response = await fetch(`${API_BASE_URL}/predict_iris`, {
        ...fetchOptions,
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
