// Adds a swatch to a palette dropzone
// Enables delete and re-import to sampler
export function addSwatchToPalette(dropzone, hex, rgbToCmyk, swatchDisplay, makeSwatchDraggable, onColorSelected) {
  const swatch = document.createElement('div');
  swatch.className = 'swatch';
  swatch.style.backgroundColor = hex;
  swatch.title = hex;

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '×';
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent triggering re-import
    swatch.remove();
    
    // Mark palette as modified when a swatch is removed
    const paletteCard = dropzone.closest('.palette-card');
    if (paletteCard && paletteCard._markModified) {
      paletteCard._markModified();
    }
  });

  // Re-import to sampler on click
  swatch.addEventListener('click', () => {
    const rgb = hexToRgb(hex);
    const { c, m, y, k } = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const cmyk = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;

    swatchDisplay(hex, rgb, cmyk);
    
    // Notify callback to update color wheel
    if (onColorSelected) {
      onColorSelected(hex);
    }
  });

  swatch.appendChild(deleteBtn);
  dropzone.appendChild(swatch);
}

// Converts hex string to RGB object
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}