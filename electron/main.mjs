import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: false,
      webSecurity: false,
      preload: path.join(path.dirname(new URL(import.meta.url).pathname), 'preload.mjs'),
    },
    icon: path.join(path.dirname(new URL(import.meta.url).pathname), '../public/icon.png'),
    titleBarStyle: 'default',
    show: false,
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(path.dirname(new URL(import.meta.url).pathname), '../out/index.html')}`;
  
  console.log('Loading URL:', startUrl);
  console.log('Is development:', isDev);
  
  mainWindow.loadURL(startUrl).catch(err => {
    console.error('Failed to load URL:', err);
    // Fallback to localhost if file loading fails
    if (!isDev) {
      console.log('Falling back to localhost...');
      mainWindow.loadURL('http://localhost:3001');
    }
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development and allow in production
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // Enable DevTools in production via menu or keyboard shortcut
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'i') {
      mainWindow.webContents.toggleDevTools();
    }
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handler to load credentials
ipcMain.handle('load-credentials', async () => {
  try {
    const credentialsPath = isDev 
      ? path.join(process.cwd(), 'credentials', 'credentials.toml')
      : path.join(process.resourcesPath, 'credentials', 'credentials.toml');
    
    console.log('Attempting to load credentials from:', credentialsPath);
    console.log('File exists:', fs.existsSync(credentialsPath));
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`Credentials file not found at: ${credentialsPath}`);
    }
    
    const content = fs.readFileSync(credentialsPath, 'utf8');
    console.log('Successfully loaded credentials, length:', content.length);
    return content;
  } catch (error) {
    console.error('Failed to load credentials in Electron:', error);
    console.error('Error details:', error.message);
    console.error('Current working directory:', process.cwd());
    throw error;
  }
});

// Disable sandbox for development/testing
app.commandLine.appendSwitch('--no-sandbox');

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Set application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' }
    ]
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { 
        label: 'Toggle Developer Tools',
        accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
        click: () => {
          if (mainWindow) {
            mainWindow.webContents.toggleDevTools();
          }
        }
      },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
