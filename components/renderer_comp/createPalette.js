// Creates a new palette card with name input, copy/delete buttons, and dropzone
export function createPalette(container, addSwatchToPalette, rgbToCmyk, swatchDisplay, makeSwatchDraggable, onColorSelected) {
  const paletteCard = document.createElement('div');
  paletteCard.className = 'palette-card';

  // Palette name input
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Untitled Palette';
  nameInput.className = 'palette-name';

  // Helper to mark palette as modified
  function markModified() {
    paletteCard.classList.add('modified');
  }

  // Track changes to name
  nameInput.addEventListener('input', markModified);

  // Action buttons: copy + delete
  const actions = document.createElement('div');
  actions.className = 'palette-actions';

  const saveBtn = document.createElement('button');
  saveBtn.textContent = '💾 Save';
  saveBtn.addEventListener('click', async () => {
    try {
      const name = (nameInput.value || 'Untitled Palette').trim();
      const colors = Array.from(dropzone.querySelectorAll('.swatch'))
        .map(s => s.getAttribute('title'))
        .filter(Boolean);
      
      // Check if this is an existing saved palette or a new one
      const existingProjectId = paletteCard.dataset.projectId;
      const existingPaletteId = paletteCard.dataset.paletteId;
      
      if (existingProjectId && existingPaletteId) {
        // Update existing palette
        await window.projectsAPI.updatePaletteInProject(
          existingProjectId,
          existingPaletteId,
          { name, colors }
        );
      } else {
        // Create new palette
        // Ensure a project exists
        const projects = await window.projectsAPI?.listProjects?.() || [];
        let projectId;
        if (!projects.length) {
          const proj = await window.projectsAPI.createProject('Local');
          projectId = proj.id;
        } else {
          // For now, use the first project; later add a picker UI
          projectId = projects[0].id;
        }
        const palette = await window.projectsAPI.addPaletteToProject(projectId, name, colors);
        // Store IDs for future updates
        paletteCard.dataset.projectId = projectId;
        paletteCard.dataset.paletteId = palette.id;
      }
      
      saveBtn.textContent = '✅ Saved';
      // Remove modified indicator
      paletteCard.classList.remove('modified');
      setTimeout(() => { saveBtn.textContent = '💾 Save'; }, 1200);
    } catch (err) {
      console.error('Failed to save palette:', err);
      saveBtn.textContent = '❌ Error';
      setTimeout(() => { saveBtn.textContent = '💾 Save'; }, 1500);
    }
  });

  const copyBtn = document.createElement('button');
  copyBtn.textContent = '📋 Copy';
  copyBtn.addEventListener('click', () => {
    // Duplicate this palette as a new card
    createPalette(container, addSwatchToPalette, rgbToCmyk, swatchDisplay, makeSwatchDraggable);
    
    // Get the newly created card (last one in container)
    const cards = container.querySelectorAll('.palette-card');
    const newCard = cards[cards.length - 1];
    
    // Copy the name
    const newNameInput = newCard.querySelector('.palette-name');
    const currentName = nameInput.value || 'Untitled Palette';
    if (newNameInput) newNameInput.value = `${currentName} (Copy)`;
    
    // Copy all swatches
    const newDropzone = newCard.querySelector('.palette-dropzone');
    const currentSwatches = Array.from(dropzone.querySelectorAll('.swatch'))
      .map(s => s.getAttribute('title'))
      .filter(Boolean);
    
    if (newDropzone && currentSwatches.length > 0) {
      // Remove placeholder text
      const placeholder = newDropzone.querySelector('p');
      if (placeholder) placeholder.remove();
      
      // Add each color
      for (const hex of currentSwatches) {
        addSwatchToPalette(newDropzone, hex, rgbToCmyk, swatchDisplay, makeSwatchDraggable, onColorSelected);
      }
    }
    
    // Mark the new card as modified (unsaved)
    newCard.classList.add('modified');
    
    // Scroll to the new card
    newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '🗑️ Delete';
  deleteBtn.addEventListener('click', async () => {
    // If this is a saved palette, delete from storage
    const projectId = paletteCard.dataset.projectId;
    const paletteId = paletteCard.dataset.paletteId;
    
    if (projectId && paletteId) {
      try {
        await window.projectsAPI.deletePaletteFromProject(projectId, paletteId);
      } catch (err) {
        console.error('Failed to delete palette from storage:', err);
      }
    }
    
    // Remove from UI
    paletteCard.remove();
  });

  actions.appendChild(saveBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(deleteBtn);

  // Header row: name + buttons
  const header = document.createElement('div');
  header.className = 'palette-header';
  header.appendChild(nameInput);
  header.appendChild(actions);

  // Dropzone for swatches
  const dropzone = document.createElement('div');
  dropzone.className = 'palette-dropzone';

  const dropText = document.createElement('p');
  dropText.textContent = 'Drag swatches here';
  dropText.style.color = '#666';
  dropzone.appendChild(dropText);

  // Enable drop behavior
  dropzone.addEventListener('dragover', (e) => e.preventDefault());
  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    const hex = e.dataTransfer.getData('text/plain');
    addSwatchToPalette(dropzone, hex, rgbToCmyk, swatchDisplay, makeSwatchDraggable, onColorSelected);
    markModified(); // Mark as modified when colors change
  });

  // Assemble palette card
  paletteCard.appendChild(header);
  paletteCard.appendChild(dropzone);
  container.appendChild(paletteCard);
  
  // Store markModified on card so addSwatchToPalette can call it
  paletteCard._markModified = markModified;
}