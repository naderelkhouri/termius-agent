const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

if (process.platform === 'linux') {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
}

let mainWindow = null;
let serverProcess = null;
const SERVER_URL = 'http://127.0.0.1:3001';

function checkServerAlive() {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}/api/telemetry/metrics`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendRunning() {
  const isAlive = await checkServerAlive();
  if (isAlive) {
    console.log('[Electron] Servidor backend já ativo em 127.0.0.1:3001');
    return;
  }

  console.log('[Electron] Iniciando servidor backend embutido...');
  const serverScript = path.join(__dirname, '..', 'server', 'index.js');
  serverProcess = spawn(process.execPath || 'node', [serverScript], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: '3001',
      NODE_ENV: 'production'
    },
    stdio: 'inherit'
  });

  serverProcess.on('exit', (code) => {
    console.log(`[Electron] Backend encerrou com código ${code}`);
  });

  // Aguardar até o servidor responder
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await checkServerAlive()) {
      console.log('[Electron] Backend pronto para conexões.');
      return;
    }
  }
  throw new Error('Falha ao inicializar o backend local na porta 3001');
}

function createMenu() {
  const template = [
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Recarregar App',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => mainWindow && mainWindow.reload()
        },
        { type: 'separator' },
        {
          label: 'Sair',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { label: 'Desfazer', role: 'undo' },
        { label: 'Refazer', role: 'redo' },
        { type: 'separator' },
        { label: 'Copiar', role: 'copy' },
        { label: 'Colar', role: 'paste' },
        { label: 'Selecionar Tudo', role: 'selectAll' }
      ]
    },
    {
      label: 'Visualizar',
      submenu: [
        { label: 'Zoom In', role: 'zoomIn' },
        { label: 'Zoom Out', role: 'zoomOut' },
        { label: 'Resetar Zoom', role: 'resetZoom' },
        { type: 'separator' },
        { label: 'Tela Cheia', role: 'togglefullscreen' },
        {
          label: 'Ferramentas do Desenvolvedor',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow && mainWindow.webContents.toggleDevTools()
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  await ensureBackendRunning();

  const iconPath = path.join(__dirname, 'icon.png');

  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0d1117',
    title: 'Termius Agent Suite',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true
    }
  });

  createMenu();

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC handlers para controles nativos de janela
ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

app.whenReady().then(createWindow);

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

app.on('before-quit', () => {
  if (serverProcess) {
    try {
      serverProcess.kill('SIGTERM');
    } catch {}
  }
});
