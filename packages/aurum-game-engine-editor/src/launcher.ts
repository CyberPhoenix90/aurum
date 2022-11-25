import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import open from 'open';
import { join } from 'path';
import { MessageType } from './protocol.js';

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,

        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: join(__dirname, 'initializer.js'),
            webgl: true
        }
    });

    win.loadFile('index.html');
    win.setMenu(null);
    win.webContents.openDevTools();
}

ipcMain.handle('*', (e, data) => {
    switch (data.type) {
        case MessageType.OpenFolder:
            open(data.payload.path);
            return undefined;
        case MessageType.PickFolder:
            return dialog.showOpenDialog({
                defaultPath: data.payload.defaultPath,
                properties: ['openDirectory']
            });
        case MessageType.PickFile:
            return dialog.showOpenDialog({
                properties: ['openFile'],
                defaultPath: data.payload.defaultPath,
                filters: data.payload.filters
            });
    }

    throw new Error('Unknown message type: ' + data.type);
});

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
