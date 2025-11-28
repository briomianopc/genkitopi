const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const AdmZip = require('adm-zip'); // 引入库

const UUID = process.env.UUID || '86c50e3a-5b87-49dd-bd20-03c7f2735e40';
const PORT = process.env.PORT || 8080;
const XRAY_VERSION = 'v1.8.4'; 

function downloadAndInstall() {
  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip`;
  
  if (!fs.existsSync('xray')) {
    console.log(`[Node] Downloading Xray via curl: ${downloadUrl}`);
    try {
      // 1. 依然用 curl 下载，因为这比 axios 写起来代码少，且容器通常都有 curl
      execSync(`curl -L -o xray.zip "${downloadUrl}"`);
      
      console.log('[Node] Unzipping via adm-zip...');
      // 2. 使用 adm-zip 解压，不再依赖系统 unzip 命令
      const zip = new AdmZip('xray.zip');
      zip.extractAllTo('.', true); // 解压到当前目录
      
      // 3. 赋予执行权限
      execSync('chmod +x xray');
      
      console.log('[Node] Xray installed successfully.');
    } catch (error) {
      console.error('[Node] Download/Install failed:', error.message);
      process.exit(1);
    }
  }
}

function generateConfig() {
  // ... 保持不变 ...
  let configContent = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  configContent = configContent.replace(/PORT_PLACEHOLDER/g, parseInt(PORT));
  configContent = configContent.replace(/UUID_PLACEHOLDER/g, UUID);
  fs.writeFileSync('config_run.json', configContent);
}

function startXray() {
  // ... 保持不变 ...
  console.log(`[Node] Starting Xray on port ${PORT}...`);
  const child = spawn('./xray', ['-c', 'config_run.json'], { stdio: 'inherit' });
  child.on('exit', (code) => process.exit(code));
}

try {
  downloadAndInstall();
  generateConfig();
  startXray();
} catch (e) {
  console.error(e);
  process.exit(1);
}
