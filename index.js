const fs = require('fs');
const { spawn, execSync } = require('child_process');
const AdmZip = require('adm-zip'); // 引入解压库

// 1. 获取环境变量
const UUID = process.env.UUID || '86c50e3a-5b87-49dd-bd20-03c7f2735e40';
const PORT = process.env.PORT || 8080;
const PRIVATE_KEY = process.env.PRIVATE_KEY; // 必填：REALITY 私钥
const SHORT_ID = process.env.SHORT_ID || ''; 
const XRAY_VERSION = 'v1.8.4';

function downloadAndInstall() {
  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip`;
  
  if (!fs.existsSync('xray')) {
    console.log(`[Node] Downloading Xray via curl: ${downloadUrl}`);
    try {
      // 使用 curl 下载，这比引入 axios 更轻量
      execSync(`curl -L -o xray.zip "${downloadUrl}"`);
      
      console.log('[Node] Unzipping via adm-zip...');
      // === 核心：使用 adm-zip 解压 ===
      const zip = new AdmZip('xray.zip');
      zip.extractAllTo('.', true); // 解压到当前目录
      // ============================
      
      // 赋予执行权限
      execSync('chmod +x xray');
      
      console.log('[Node] Xray installed successfully.');
    } catch (error) {
      console.error('[Node] Install failed:', error.message);
      process.exit(1);
    }
  }
}

function generateConfig() {
  if (!PRIVATE_KEY) {
    console.error('[Node] FATAL ERROR: PRIVATE_KEY is missing in Env Vars!');
    process.exit(1);
  }
  
  console.log(`[Node] Generating REALITY config... Port: ${PORT}`);
  let config = fs.readFileSync('config.json', 'utf8');
  
  // 替换配置模板中的占位符
  config = config.replace(/PORT_PLACEHOLDER/g, parseInt(PORT))
                 .replace(/UUID_PLACEHOLDER/g, UUID)
                 .replace(/PRIVATE_KEY_PLACEHOLDER/g, PRIVATE_KEY)
                 .replace(/SHORT_ID_PLACEHOLDER/g, SHORT_ID);
                 
  fs.writeFileSync('config_run.json', config);
}

function startXray() {
  console.log('[Node] Starting Xray Core with REALITY...');
  // 启动 Xray
  const child = spawn('./xray', ['-c', 'config_run.json'], { stdio: 'inherit' });
  child.on('exit', code => process.exit(code));
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
