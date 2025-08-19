const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')
const { ipcMain } = require('electron')

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

  // 拖动相关变量
  let isDragging = false

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

  // 开始拖动窗口
  ipcMain.on('drag-start', () => {
    isDragging = true
  })

  // 停止拖动窗口
  ipcMain.on('drag-stop', () => {
    isDragging = false
  })

  // 拖动窗口 - 使用绝对位置而不是增量
  ipcMain.on('drag-move', (event, { x, y }) => {
    if (isDragging) {
      // 获取屏幕信息用于边界检查
      const { screen } = require('electron')
      const primaryDisplay = screen.getPrimaryDisplay()
      const { width: screenWidth, height: screenHeight } =
        primaryDisplay.workAreaSize
      const { x: screenX, y: screenY } = primaryDisplay.workArea
      const windowBounds = win.getBounds()

      // 计算边界限制
      const minX = screenX - windowBounds.width + 50 // 允许窗口部分移出左边界
      const maxX = screenX + screenWidth - 50 // 保留至少50px在右边界内
      const minY = screenY // 不允许移出上边界
      const maxY = screenY + screenHeight - 50 // 保留至少50px在下边界内

      // 应用边界限制
      const boundedX = Math.max(minX, Math.min(x, maxX))
      const boundedY = Math.max(minY, Math.min(y, maxY))

      // 设置窗口位置
      win.setPosition(Math.round(boundedX), Math.round(boundedY))
    }
  })

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
