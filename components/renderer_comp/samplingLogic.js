// Handles click-and-hold sampling, live preview, and swatch display
export function samplingLogic(dropper, swatch, livePreview, makeSwatchDraggable, rgbToCmyk, onColorSampled) {
  let isSampling = false;
  let previewInterval = null;
  let lastMouse = { x: 0, y: 0 };

  // Start sampling on mouse down
  dropper.addEventListener('mousedown', (e) => {
    isSampling = true;
    dropper.innerText = '🕵️ Hold and hover...';
    document.body.style.cursor = 'crosshair';
    // Initialize pointer position immediately
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;

    // Track mouse position during sampling
    const onMove = (ev) => {
      lastMouse.x = ev.clientX;
      lastMouse.y = ev.clientY;
    };
  // Keep receiving moves while pressed
  try { dropper.setPointerCapture(e.pointerId); } catch (_) {}
  document.addEventListener('mousemove', onMove);
    // Store cleanup handler on element to ensure removal
    dropper._onMoveCleanup = () => document.removeEventListener('mousemove', onMove);

    // Poll cursor color every 100ms
    previewInterval = setInterval(async () => {
      if (!window.dropperAPI || !window.dropperAPI.getCursorColor) return;
      const { r, g, b } = await window.dropperAPI.getCursorColor();
      const hex = rgbToHex(r, g, b);
      const rgb = { r, g, b };
      const { c, m, y, k } = rgbToCmyk(r, g, b);
      const cmyk = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
      
      // Update live preview area (separate from selected color)
      livePreview.innerHTML = `
        <div style="
          width: 100px;
          height: 100px;
          background-color: ${hex};
          border: 1px solid #333;
          margin-bottom: 10px;
        "></div>
        <div><strong>Hex:</strong> ${hex}</div>
        <div><strong>RGB:</strong> rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</div>
        <div><strong>CMYK:</strong> ${cmyk}</div>
      `;
    }, 100);
  });

  // Sample and cleanup on mouse up
  document.addEventListener('mouseup', async () => {
    if (!isSampling) return;
    isSampling = false;
    dropper.innerText = '🎯 Sample Color';
    document.body.style.cursor = 'default';

    clearInterval(previewInterval);
    if (dropper._onMoveCleanup) {
      dropper._onMoveCleanup();
      delete dropper._onMoveCleanup;
    }
    
    // Reset live preview to placeholder
    livePreview.innerHTML = '<div style="color: #999; font-style: italic;">Hold "Sample Color" to see live preview</div>';

    if (!window.dropperAPI || !window.dropperAPI.getCursorColor) return;
    const { r, g, b } = await window.dropperAPI.getCursorColor();
    const hex = rgbToHex(r, g, b);
    const rgb = { r, g, b };
    const { c, m, y, k } = rgbToCmyk(r, g, b);
    const cmyk = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;

    swatchDisplay(hex, rgb, cmyk);
    
    // Notify callback to update color wheel
    if (onColorSampled) {
      onColorSampled(hex);
    }
  });

  // Converts RGB to hex string
  function rgbToHex(r, g, b) {
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Displays sampled swatch and color codes
  function swatchDisplay(hex, rgb, cmyk) {
    swatch.innerHTML = `
      <div style="
        width: 100px;
        height: 100px;
        background-color: ${hex};
        border: 1px solid #333;
        margin-bottom: 10px;
      "></div>
      <div><strong>Hex:</strong> ${hex}</div>
      <div><strong>RGB:</strong> rgb(${rgb.r}, ${rgb.g}, ${rgb.b})</div>
      <div><strong>CMYK:</strong> ${cmyk}</div>
    `;

    const swatchBox = swatch.querySelector('div');
    makeSwatchDraggable(swatchBox, hex);
  }

  // Expose swatchDisplay for re-import use
  return { swatchDisplay };
}
