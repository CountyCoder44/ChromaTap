// Enables drag-and-drop behavior for a swatch element
// hex: the color code to transfer during drag
export function makeSwatchDraggable(swatchEl, hex) {
  swatchEl.setAttribute('draggable', 'true');

  swatchEl.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', hex); // Pass hex code to drop target
  });
}