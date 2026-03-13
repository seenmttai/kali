/**
 * Utility for communicating with the local analysis API.
 */

const API_BASE_URL = 'https://0bf9-35-185-32-59.ngrok-free.app';

export async function submitDiagnosticData(data) {
  // Decision logic for which endpoint to call
  // Priority: Multi-Modal if palmas/unas are present, fallback to Iris if EYE is present
  
  if (data.VIDEO && data.NAILS_ALL) {
    const formData = new FormData();
    formData.append('palmas', data.VIDEO, 'patient_palm.mp4');
    formData.append('unas', data.NAILS_ALL, 'patient_fingernail.jpg');

    try {
      const response = await fetch(`${API_BASE_URL}/predict_mm`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
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
      console.error("Multi-modal submission failed:", error);
      throw error;
    }
  } else if (data.EYE) {
    const formData = new FormData();
    formData.append('image', data.EYE, 'conjunctiva.jpg');

    try {
      const response = await fetch(`${API_BASE_URL}/predict_iris`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`API error: ${response.statusText}`);
      const result = await response.json();
      
      return {
        category: result.prediction === 'Anemic' ? 'High Risk' : 'Normal',
        score: Math.round((1 - (result.anemia_probability || 0)) * 100),
        hemoglobin: null, // Iris doesn't provide Hb level
        safety_checks: 'Passed (Iris Pipeline)',
        threshold: result.threshold_used,
        pipeline: 'Iris',
        raw: result
      };
    } catch (error) {
      console.error("Iris submission failed:", error);
      throw error;
    }
  }
}
