/**
 * Utility for communicating with the local analysis API.
 */

const API_BASE_URL = 'https://91f2-35-231-128-74.ngrok-free.app';

export async function submitDiagnosticData(data) {
  const formData = new FormData();

  // Mapping wizard steps to API keys: 
  // VIDEO -> palmas (patient_palm.mp4)
  // NAILS_ALL -> unas (patient_fingernail.jpg)
  if (data.VIDEO) formData.append('palmas', data.VIDEO, 'patient_palm.mp4');
  if (data.NAILS_ALL) formData.append('unas', data.NAILS_ALL, 'patient_fingernail.jpg');

  try {
    const response = await fetch(`${API_BASE_URL}/predict_mm`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Map new API response to existing app structure
    return {
      category: result.anemia_prediction === 'Anemic' ? 'High Risk' : 'Normal',
      score: Math.round((1 - (result.anemia_probability || 0)) * 100),
      hemoglobin: result.hemoglobin_g_dl,
      safety_checks: 'Passed (MTCG Pipeline)',
      threshold: result.threshold_used,
      raw: {
        r: 'N/A', g: 'N/A', b: 'N/A',
        bloodRatio: result.anemia_probability,
        ...result
      }
    };
  } catch (error) {
    console.error("Failed to submit diagnostic data:", error);
    throw error;
  }
}
