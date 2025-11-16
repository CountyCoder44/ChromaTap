import { samplingLogic } from './components/renderer_comp/samplingLogic.js';
import { addSwatchToPalette } from './components/renderer_comp/addSwatchToPalette.js';
import { makeSwatchDraggable } from './components/renderer_comp/makeSwatchDraggable.js';
import { createPalette } from './components/renderer_comp/createPalette.js';
import { rgbToCmyk } from './components/renderer_comp/rgbToCmyk.js';
import { initColorWheel } from './components/colorWheelManager.js';

const dropper = document.getElementById('dropper');
const swatch = document.getElementById('swatch');
const livePreview = document.getElementById('live-preview-content');
const createPaletteBtn = document.getElementById('create-palette');
const paletteContainer = document.getElementById('palette-container');

// Color wheel elements
const colorWheelCanvas = document.getElementById('color-wheel');
const brightnessSlider = document.getElementById('brightness-slider');
const saturationSlider = document.getElementById('saturation-slider');
const invertBtn = document.getElementById('invert-color');

// Initialize sampling logic and get swatchDisplay function
const { swatchDisplay } = samplingLogic(dropper, swatch, livePreview, makeSwatchDraggable, rgbToCmyk, (hex) => {
  // Callback when color is sampled - update the color wheel
  colorWheel.setColor(hex);
});

// Initialize color wheel
const colorWheel = initColorWheel(colorWheelCanvas, brightnessSlider, saturationSlider, (hex, rgb) => {
  const { c, m, y, k } = rgbToCmyk(rgb.r, rgb.g, rgb.b);
  const cmyk = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
  swatchDisplay(hex, rgb, cmyk);
});

// Invert color button
invertBtn.addEventListener('click', () => {
  const currentColor = colorWheel.getCurrentColor();
  const invertedRgb = {
    r: 255 - currentColor.r,
    g: 255 - currentColor.g,
    b: 255 - currentColor.b
  };
  const invertedHex = `#${invertedRgb.r.toString(16).padStart(2, '0')}${invertedRgb.g.toString(16).padStart(2, '0')}${invertedRgb.b.toString(16).padStart(2, '0')}`;
  
  colorWheel.setColor(invertedHex);
  const { c, m, y, k } = rgbToCmyk(invertedRgb.r, invertedRgb.g, invertedRgb.b);
  const cmyk = `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
  swatchDisplay(invertedHex, invertedRgb, cmyk);
});

// Wire up palette creation
createPaletteBtn.addEventListener('click', () => {
  createPalette(
    paletteContainer,
    addSwatchToPalette,
    rgbToCmyk,
    swatchDisplay,
    makeSwatchDraggable,
    (hex) => colorWheel.setColor(hex) // Update color wheel when palette swatch is clicked
  );
});

// Load saved palettes on startup
async function loadSavedPalettes() {
  try {
    const projects = await window.projectsAPI?.listProjects?.();
    if (!projects || !projects.length) return;

    // Load all palettes from all projects
    for (const project of projects) {
      if (!project.palettes || !project.palettes.length) continue;
      
      for (const palette of project.palettes) {
        // Create a palette card
        createPalette(
          paletteContainer,
          addSwatchToPalette,
          rgbToCmyk,
          swatchDisplay,
          makeSwatchDraggable,
          (hex) => colorWheel.setColor(hex) // Update color wheel when palette swatch is clicked
        );
        
        // Get the newly created card (last one in container)
        const cards = paletteContainer.querySelectorAll('.palette-card');
        const card = cards[cards.length - 1];
        
        // Set the palette name
        const nameInput = card.querySelector('.palette-name');
        if (nameInput) nameInput.value = palette.name;
        
        // Get the dropzone and add all saved colors
        const dropzone = card.querySelector('.palette-dropzone');
        if (dropzone && palette.colors) {
          // Remove the placeholder text
          const placeholder = dropzone.querySelector('p');
          if (placeholder) placeholder.remove();
          
          // Add each color as a swatch
          for (const hex of palette.colors) {
            addSwatchToPalette(dropzone, hex, rgbToCmyk, swatchDisplay, makeSwatchDraggable, (hex) => colorWheel.setColor(hex));
          }
        }
        
        // Store palette metadata for future saves/updates
        card.dataset.projectId = project.id;
        card.dataset.paletteId = palette.id;
      }
    }
  } catch (err) {
    console.error('Failed to load saved palettes:', err);
  }
}

// Load palettes when page loads
loadSavedPalettes();