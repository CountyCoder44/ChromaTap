const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const robot = require('robotjs');
const paletteManager = require(path.join(__dirname, 'components', 'paletteManager.js'));

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Load your HTML interface
  mainWindow.loadFile('index.html');

  // ✅ Open DevTools only after content is loaded
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.openDevTools();
  });
}

// Handle color sampling from cursor
ipcMain.handle('get-cursor-color', () => {
  const { x, y } = screen.getCursorScreenPoint();
  const hex = robot.getPixelColor(x, y);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return { r, g, b };
});

// Projects storage IPC
ipcMain.handle('projects:list', () => paletteManager.listProjects());
ipcMain.handle('projects:create', (_e, name) => paletteManager.createProject(name));
ipcMain.handle('projects:rename', (_e, projectId, newName) => paletteManager.renameProject(projectId, newName));
ipcMain.handle('projects:delete', (_e, projectId) => paletteManager.deleteProject(projectId));
ipcMain.handle('projects:palette:add', (_e, projectId, paletteName, colors) =>
  paletteManager.addPaletteToProject(projectId, paletteName, colors)
);
ipcMain.handle('projects:palette:update', (_e, projectId, paletteId, updates) =>
  paletteManager.updatePaletteInProject(projectId, paletteId, updates)
);
ipcMain.handle('projects:palette:delete', (_e, projectId, paletteId) =>
  paletteManager.deletePaletteFromProject(projectId, paletteId)
);
ipcMain.handle('projects:saveAll', (_e, projects) => paletteManager.saveAllProjects(projects));
ipcMain.handle('projects:export', () => paletteManager.exportProjectsJSON());
ipcMain.handle('projects:getPath', () => paletteManager.getProjectsFilePath());

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
