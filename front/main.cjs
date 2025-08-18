const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 350,
    height: 450,
    frame: false, // 隐藏原生的标题栏和控制按钮
    transparent: false,
    resizable: false, // 禁止调整窗口大小
    minimizable: true, // 允许最小化窗口
    maximizable: false, // 禁止最大化窗口
    closable: true, // 允许关闭窗口
    alwaysOnTop: false, // 不总是位于最上层
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'public/preload.js'),
      webSecurity: true,
    },
    show: false,
    autoHideMenuBar: true, // 隐藏菜单栏
    titleBarStyle: 'hidden', // 隐藏标题栏
  })
  // 监听渲染进程的关闭窗口请求
  const { ipcMain } = require('electron')
  ipcMain.on('close-window', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      wins[0].close()
    }
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
