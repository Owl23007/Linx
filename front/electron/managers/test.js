// filepath: d:\Code\Linx\front\electron\managers\test.js
// ...existing code...
async function runReset() {
  const { default: KeytarManager } = await import('./keytar.js');
  const manager = new KeytarManager();
  await manager.init();  // 初始化 mainKEK
  await manager.loadCurrentInstance();  // 加载实例
  await manager.resetCurrentInstanceData();  // 重置数据
  console.log('重置完成');
}

runReset().catch(console.error);
