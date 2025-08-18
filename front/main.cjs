const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 隐藏原生的标题栏和控制按钮
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    show: false,
  })

  // 开发者工具（开发环境）
  if (!app.isPackaged) {
    win.webContents.openDevTools()
  }

  // 开发环境加载 Vite dev server，生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_PORT || '5173'
    win.loadURL(`http://localhost:${port}`)
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'))
  }

  // 窗口准备好后显示
  win.once('ready-to-show', () => {
    win.show()
  })
}

Menu.setApplicationMenu(null)

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
