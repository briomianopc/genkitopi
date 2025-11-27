const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const UUID = process.env.UUID || '86c50e3a-5b87-49dd-bd20-03c7f2735e40';
const PORT = process.env.PORT || 8080;
const XRAY_VERSION = 'v1.8.4'; 

function downloadAndInstall() {
  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip`;
  
  if (!fs.existsSync('xray')) {
    console.log(`[Node] Downloading Xray via curl: ${downloadUrl}`);
    try {
      // 使用 curl 下载 (-L 跟随重定向, -o 输出文件)
      execSync(`curl -L -o xray.zip "${downloadUrl}"`);
      
      console.log('[Node] Unzipping...');
      // 使用系统 unzip 命令
      execSync('unzip -o xray.zip');
      
      // 赋予执行权限
      execSync('chmod +x xray');
      
      console.log('[Node] Xray installed successfully.');
    } catch (error) {
      console.error('[Node] Download/Install failed:', error.message);
      process.exit(1);
    }
  }
}

function generateConfig() {
  // 读取模板
  let configContent = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  
  // 替换变量
  configContent = configContent.replace(/PORT_PLACEHOLDER/g, parseInt(PORT));
  configContent = configContent.replace(/UUID_PLACEHOLDER/g, UUID);
  
  // 写入运行配置
  fs.writeFileSync('config_run.json', configContent);
}

function startXray() {
  console.log(`[Node] Starting Xray on port ${PORT}...`);
  // 启动 Xray
  const child = spawn('./xray', ['-c', 'config_run.json'], { stdio: 'inherit' });
  
  child.on('error', (err) => {
    console.error('[Node] Failed to start process:', err);
  });

  child.on('exit', (code) => {
    console.log(`[Node] Xray exited with code ${code}`);
    process.exit(code);
  });
}

// 主流程
try {
  downloadAndInstall();
  generateConfig();
  startXray();
} catch (e) {
  console.error(e);
  process.exit(1);
}
