const fs = require('fs');
const path = require('path');

// Existing flat palettes file (kept for backward compatibility)
const palettePath = path.join(__dirname, '../data/palettes.json');

// New Projects storage file
const projectsPath = path.join(__dirname, '../data/projects.json');

// ---------- Utilities ----------
function ensureFile(filePath, defaultJson = '[]') {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, defaultJson, 'utf8');
}

function safeReadJSON(filePath, fallback) {
  try {
    ensureFile(filePath);
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    // If corrupted, back it up and start fresh
    try {
      const backup = `${filePath}.${Date.now()}.bak`;
      fs.copyFileSync(filePath, backup);
    } catch {}
    return fallback;
  }
}

function writeJSON(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- Back-compat: flat palettes ----------
function ensurePaletteFile() {
  ensureFile(palettePath, '[]');
}

function loadPalettes() {
  return safeReadJSON(palettePath, []);
}

function saveColor(colorObj) {
  const palettes = loadPalettes();
  palettes.push(colorObj);
  writeJSON(palettePath, palettes);
}

function deleteColor(index) {
  const palettes = loadPalettes();
  if (index >= 0 && index < palettes.length) {
    palettes.splice(index, 1);
    writeJSON(palettePath, palettes);
  }
}

// ---------- Projects-based palettes ----------
// Schema:
// Project { id, name, createdAt, updatedAt, palettes: Palette[] }
// Palette { id, name, colors: string[], createdAt, updatedAt }

function ensureProjectsFile() {
  ensureFile(projectsPath, '[]');
}

function listProjects() {
  return safeReadJSON(projectsPath, []);
}

function saveAllProjects(projects) {
  writeJSON(projectsPath, projects);
  return projects;
}

function createProject(name = 'Untitled Project') {
  const projects = listProjects();
  const now = new Date().toISOString();
  const project = {
    id: generateId('proj'),
    name,
    createdAt: now,
    updatedAt: now,
    palettes: []
  };
  projects.push(project);
  saveAllProjects(projects);
  return project;
}

function renameProject(projectId, newName) {
  const projects = listProjects();
  const idx = projects.findIndex(p => p.id === projectId);
  if (idx === -1) return null;
  projects[idx].name = newName;
  projects[idx].updatedAt = new Date().toISOString();
  saveAllProjects(projects);
  return projects[idx];
}

function deleteProject(projectId) {
  const projects = listProjects();
  const next = projects.filter(p => p.id !== projectId);
  if (next.length === projects.length) return false;
  saveAllProjects(next);
  return true;
}

function addPaletteToProject(projectId, paletteName = 'Untitled Palette', colors = []) {
  const projects = listProjects();
  const p = projects.find(p => p.id === projectId);
  if (!p) return null;
  const now = new Date().toISOString();
  const palette = {
    id: generateId('pal'),
    name: paletteName,
    colors: [...colors], // array of hex strings
    createdAt: now,
    updatedAt: now
  };
  p.palettes.push(palette);
  p.updatedAt = now;
  saveAllProjects(projects);
  return palette;
}

function updatePaletteInProject(projectId, paletteId, updates) {
  const projects = listProjects();
  const p = projects.find(p => p.id === projectId);
  if (!p) return null;
  const idx = p.palettes.findIndex(pl => pl.id === paletteId);
  if (idx === -1) return null;
  const current = p.palettes[idx];
  const next = {
    ...current,
    ...('name' in updates ? { name: updates.name } : {}),
    ...('colors' in updates ? { colors: [...updates.colors] } : {}),
    updatedAt: new Date().toISOString()
  };
  p.palettes[idx] = next;
  p.updatedAt = next.updatedAt;
  saveAllProjects(projects);
  return next;
}

function deletePaletteFromProject(projectId, paletteId) {
  const projects = listProjects();
  const p = projects.find(p => p.id === projectId);
  if (!p) return false;
  const next = p.palettes.filter(pl => pl.id !== paletteId);
  if (next.length === p.palettes.length) return false;
  p.palettes = next;
  p.updatedAt = new Date().toISOString();
  saveAllProjects(projects);
  return true;
}

// ---------- Backup helpers (for future server sync) ----------
function getProjectsFilePath() {
  ensureProjectsFile();
  return projectsPath;
}

function exportProjectsJSON() {
  const projects = listProjects();
  return JSON.stringify(projects, null, 2);
}

// Initialize storage files on load
ensurePaletteFile();
ensureProjectsFile();

module.exports = {
  // legacy flat palettes
  loadPalettes,
  saveColor,
  deleteColor,

  // projects API
  listProjects,
  saveAllProjects,
  createProject,
  renameProject,
  deleteProject,
  addPaletteToProject,
  updatePaletteInProject,
  deletePaletteFromProject,

  // backup helpers
  getProjectsFilePath,
  exportProjectsJSON
};