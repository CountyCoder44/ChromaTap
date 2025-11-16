// Color wheel manager - handles HSV color wheel rendering and interaction
export function initColorWheel(canvas, brightnessSlider, saturationSlider, onColorChange) {
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = Math.min(centerX, centerY) - 5;
  
  let currentHue = 0;
  let currentSaturation = 100;
  let currentBrightness = 100;

  // Draw the color wheel
  function drawWheel() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw HSV color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 90) * Math.PI / 180;
      const endAngle = (angle + 1 - 90) * Math.PI / 180;
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      const hue = angle;
      const saturation = currentSaturation;
      const brightness = currentBrightness;
      
      // Inner: white (low saturation)
      gradient.addColorStop(0, hsvToRgbString(hue, 0, brightness));
      // Outer: full color
      gradient.addColorStop(1, hsvToRgbString(hue, saturation, brightness));
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineTo(centerX, centerY);
      ctx.fill();
    }
    
    // Draw center circle (brightness indicator)
    ctx.fillStyle = hsvToRgbString(currentHue, 0, currentBrightness);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Convert HSV to RGB string
  function hsvToRgbString(h, s, v) {
    const rgb = hsvToRgb(h, s, v);
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }

  // Convert HSV to RGB object
  function hsvToRgb(h, s, v) {
    s = s / 100;
    v = v / 100;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    
    let r, g, b;
    if (h < 60) { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  // Convert RGB to hex
  function rgbToHex(r, g, b) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Handle wheel click
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance <= radius) {
      // Calculate hue from angle
      let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (angle < 0) angle += 360;
      currentHue = angle;
      
      // Calculate saturation from distance
      const saturationFromClick = Math.min((distance / radius) * 100, 100);
      currentSaturation = saturationFromClick;
      saturationSlider.value = currentSaturation;
      
      drawWheel();
      notifyColorChange();
    }
  });

  // Handle brightness slider
  brightnessSlider.addEventListener('input', (e) => {
    currentBrightness = parseInt(e.target.value);
    drawWheel();
    notifyColorChange();
  });

  // Handle saturation slider
  saturationSlider.addEventListener('input', (e) => {
    currentSaturation = parseInt(e.target.value);
    drawWheel();
    notifyColorChange();
  });

  // Notify callback with current color
  function notifyColorChange() {
    const rgb = hsvToRgb(currentHue, currentSaturation, currentBrightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    onColorChange(hex, rgb);
  }

  // Set color from external source (e.g., sampled color)
  function setColor(hex) {
    // Convert hex to RGB
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // Convert RGB to HSV
    const hsv = rgbToHsv(r, g, b);
    currentHue = hsv.h;
    currentSaturation = hsv.s;
    currentBrightness = hsv.v;
    
    brightnessSlider.value = currentBrightness;
    saturationSlider.value = currentSaturation;
    
    drawWheel();
  }

  // Convert RGB to HSV
  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) h = 60 * (((g - b) / diff) % 6);
      else if (max === g) h = 60 * (((b - r) / diff) + 2);
      else h = 60 * (((r - g) / diff) + 4);
    }
    if (h < 0) h += 360;
    
    const s = max === 0 ? 0 : (diff / max) * 100;
    const v = max * 100;
    
    return { h, s, v };
  }

  // Initial draw
  drawWheel();

  return { setColor, getCurrentColor: () => hsvToRgb(currentHue, currentSaturation, currentBrightness) };
}
