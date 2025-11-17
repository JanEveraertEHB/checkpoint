const { app, BrowserWindow } = require('electron/main')
const { ipcMain, session } = require('electron')
const path = require('node:path')


ipcMain.handle('get-cookies', async () => {
  return await session.defaultSession.cookies.get({})
})
ipcMain.handle('set-cookie', async (event, cookie) => {
  await session.defaultSession.cookies.set(cookie)
  return true
})

function createWindow () {
  const win = new BrowserWindow({
    width: 400,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })

  win.loadFile('./src/index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
