const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');

// 环境变量
const UUID = process.env.UUID || '86c50e3a-5b87-49dd-bd20-03c7f2735e40';
const PORT = process.env.PORT || 8080; // Koyeb 内部监听端口
const PRIVATE_KEY = process.env.PRIVATE_KEY; 
const SHORT_ID = process.env.SHORT_ID || ''; 
const XRAY_VERSION = 'v1.8.4'; 

async function downloadXray() {
  // 下载逻辑同前，为节省篇幅省略，核心是下载 xray-linux-64.zip 并解压
  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip`;
  console.log(`[Node] Downloading Xray Core: ${downloadUrl}`);
  const writer = fs.createWriteStream('xray.zip');
  const response = await axios({ url: downloadUrl, method: 'GET', responseType: 'stream' });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

function installXray() {
  const zip = new AdmZip('xray.zip');
  zip.extractAllTo(__dirname, true);
  fs.chmodSync(path.join(__dirname, 'xray'), '755');
}

function generateConfig() {
  if (!PRIVATE_KEY) {
    console.error('[Node] Fatal: PRIVATE_KEY is missing.');
    process.exit(1);
  }
  const template = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  const configContent = template
    .replace(/PORT_PLACEHOLDER/g, parseInt(PORT))
    .replace(/UUID_PLACEHOLDER/g, UUID)
    .replace(/PRIVATE_KEY_PLACEHOLDER/g, PRIVATE_KEY)
    .replace(/SHORT_ID_PLACEHOLDER/g, SHORT_ID);
  fs.writeFileSync('config_run.json', configContent);
}

function startXray() {
  console.log(`[Node] Starting Xray on port ${PORT} with REALITY...`);
  const child = spawn('./xray', ['-c', 'config_run.json'], { stdio: 'inherit', cwd: __dirname });
  child.on('exit', (code) => process.exit(code));
}

async function main() {
  try {
    if (!fs.existsSync(path.join(__dirname, 'xray'))) {
      await downloadXray();
      installXray();
    }
    generateConfig();
    startXray();
  } catch (error) { console.error(error); process.exit(1); }
}
main();
