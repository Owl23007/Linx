const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const { ipcMain } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 320,
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

  // 关闭窗口
  ipcMain.on('close-window', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      wins[0].close()
    }
  })

  // 最小化窗口
  ipcMain.on('minimize-window', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      wins[0].minimize()
    }
  })

  // 最大化/还原窗口
  ipcMain.on('maximize-window', () => {
    const wins = BrowserWindow.getAllWindows()
    if (wins.length > 0) {
      const win = wins[0]
      if (win.isMaximized()) {
        win.restore()
      } else {
        win.maximize()
      }
    }
  })

  // 获取窗口边界信息
  ipcMain.handle('drag:getBounds', (e) => {
    return e.sender.getOwnerBrowserWindow().getBounds()
  })

  // 设置窗口位置
  ipcMain.handle('drag:setBounds', (e, x, y, width, height) => {
    const win = e.sender.getOwnerBrowserWindow()
    // 不用 setPosition 是因为 https://github.com/electron/electron/issues/9477
    win.setBounds({
      x: Math.round(x),
      y: Math.round(y),
      width,
      height,
    })
  })

  // 开发环境加载 Vite dev server，生产环境加载打包后的文件
  if (process.env.NODE_ENV === 'development') {
    const port = process.env.VITE_PORT || '5173'
    win.loadURL(`http://localhost:${port}`)
  } else {
    // 生产环境使用 file:// 协议加载本地文件
    const indexPath = path.join(__dirname, 'dist/index.html')
    win.loadFile(indexPath)
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
