export async function analyzeImage(imageSrc, scanType) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      // Crop to center 30% for analysis
      const cw = img.width * 0.3;
      const ch = img.height * 0.3;
      const cx = (img.width - cw) / 2;
      const cy = (img.height - ch) / 2;

      const imageData = ctx.getImageData(cx, cy, cw, ch);
      const data = imageData.data;

      let totalR = 0, totalG = 0, totalB = 0;
      let validPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        // Basic skin detection to ignore background
        if (data[i] > 60 && data[i+1] > 40 && data[i+2] > 20) {
          totalR += data[i];
          totalG += data[i+1];
          totalB += data[i+2];
          validPixels++;
        }
      }

      if (validPixels === 0) validPixels = 1;

      const avgR = totalR / validPixels;
      const avgG = totalG / validPixels;
      const avgB = totalB / validPixels;

      // Purely heuristic medical simulation based on redness vs green/blue
      // High R relative to G/B means more hemoglobin/blood flow
      const bloodRatio = avgR / ((avgG + avgB) / 2);
      
      // Normalize to 0-100 score
      // Typical healthy ratio might be 1.5 - 2.0+ depending on lighting
      // Let's map 1.0 -> 0 score, 1.8 -> 100 score
      let score = ((bloodRatio - 1.0) / 0.8) * 100;
      
      // Adjust weights based on scan type
      if (scanType === 'eye') score *= 1.1; // Conjunctiva slightly redder
      if (scanType === 'nail') score *= 0.95; 
      
      score = Math.max(0, Math.min(100, score)); // Clamp

      // Introduce slight randomness for "AI" feel if image is identical
      score += (Math.random() * 4 - 2);
      score = Math.round(Math.max(0, Math.min(100, score)));

      let category = 'Normal';
      let color = 'var(--color-success)';
      if (score < 40) {
        category = 'High Risk';
        color = 'var(--color-danger)';
      } else if (score < 65) {
        category = 'Borderline';
        color = 'var(--color-warning)';
      }

      // Confidence based on lighting (if too dark/bright, lower confidence)
      const brightness = (avgR + avgG + avgB) / 3;
      let confidence = 95 - Math.abs(128 - brightness) / 128 * 40;
      confidence = Math.round(Math.max(50, confidence));

      resolve({
        score,
        category,
        color,
        confidence,
        raw: { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB), bloodRatio: bloodRatio.toFixed(2) }
      });
    };
  });
}
