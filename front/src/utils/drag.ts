/**
 * 基于 pointer 事件的窗口拖动实现
 * 参考：https://rmw.link/zh/log/2022-03-14.electron-drag.html
 */

const IGNORE = new Set(['SELECT', 'BUTTON', 'A', 'INPUT', 'TEXTAREA'])
let moving = false

export default function drag(elem: HTMLElement) {
  // 只在 Electron 环境下启用
  if (typeof window.electronApi === 'undefined') return

  // 设置为不可拖动区域，避免与自定义拖动冲突
  ;(elem.style as any).webkitAppRegion = 'no-drag'

  let initX = 0, initY = 0, initLeft = 0, initTop = 0, initW = 0, initH = 0

  const _move = async (e: PointerEvent) => {
    const { screenX, screenY } = e
    window.electronApi?.invoke('drag:setBounds',
      Math.round(screenX - initX + initLeft),
      Math.round(screenY - initY + initTop),
      initW,
      initH
    )
  }

  const down = async (e: PointerEvent) => {
    if (moving || e.button !== 0) return // 只响应鼠标左键
    
    let p: HTMLElement | null = e.target as HTMLElement
    // 检查是否点击在忽略的元素上
    while (p) {
      if (IGNORE.has(p.nodeName)) return
      if (p.nodeName === 'BODY') break
      p = p.parentElement
    }
    
    moving = true
    initX = e.screenX
    initY = e.screenY
    
    elem.setPointerCapture(e.pointerId)
    elem.addEventListener('pointermove', _move)

    // 获取当前窗口位置和大小
    const bounds = await window.electronApi?.invoke('drag:getBounds')
    if (bounds) {
      initLeft = bounds.x
      initTop = bounds.y
      initW = bounds.width
      initH = bounds.height
    }
  }

  const up = async (e: PointerEvent) => {
    if (moving) {
      // 只有当实际移动时才调用 _move
      const deltaX = Math.abs(e.screenX - initX)
      const deltaY = Math.abs(e.screenY - initY)
      if (deltaX > 2 || deltaY > 2) { // 只有移动超过2像素才认为是拖动
        await _move(e)
      }
      elem.releasePointerCapture(e.pointerId)
      elem.removeEventListener('pointermove', _move)
      moving = false
    }
  }

  // 添加事件监听器
  elem.addEventListener('pointerdown', down)
  elem.addEventListener('pointerup', up)
  elem.addEventListener('lostpointercapture', up)
  elem.addEventListener('pointercancel', up)

  // 返回清理函数
  return () => {
    elem.removeEventListener('pointerdown', down)
    elem.removeEventListener('pointerup', up)
    elem.removeEventListener('lostpointercapture', up)
    elem.removeEventListener('pointercancel', up)
  }
}
