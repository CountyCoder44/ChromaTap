// Secure bridge between renderer and main process
const { contextBridge, ipcRenderer } = require('electron');

// Expose dropper API to renderer safely
contextBridge.exposeInMainWorld('dropperAPI', {
  getCursorColor: () => ipcRenderer.invoke('get-cursor-color') // Asks main process for pixel color
});

// Expose Projects storage API (invoke main for Node/FS work)
contextBridge.exposeInMainWorld('projectsAPI', {
  listProjects: () => ipcRenderer.invoke('projects:list'),
  createProject: (name) => ipcRenderer.invoke('projects:create', name),
  renameProject: (projectId, newName) => ipcRenderer.invoke('projects:rename', projectId, newName),
  deleteProject: (projectId) => ipcRenderer.invoke('projects:delete', projectId),
  addPaletteToProject: (projectId, paletteName, colors) =>
    ipcRenderer.invoke('projects:palette:add', projectId, paletteName, colors),
  updatePaletteInProject: (projectId, paletteId, updates) =>
    ipcRenderer.invoke('projects:palette:update', projectId, paletteId, updates),
  deletePaletteFromProject: (projectId, paletteId) =>
    ipcRenderer.invoke('projects:palette:delete', projectId, paletteId),
  saveAllProjects: (projects) => ipcRenderer.invoke('projects:saveAll', projects),
  // Backup helpers
  exportProjectsJSON: () => ipcRenderer.invoke('projects:export'),
  getProjectsFilePath: () => ipcRenderer.invoke('projects:getPath')
});
