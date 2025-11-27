const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const axios = require('axios');
const AdmZip = require('adm-zip');

const UUID = process.env.UUID || '86c50e3a-5b87-49dd-bd20-03c7f2735e40';
const PORT = process.env.PORT || 8080; // Koyeb 会自动注入这个变量
const XRAY_VERSION = 'v1.8.4'; 

async function downloadXray() {
  const downloadUrl = `https://github.com/XTLS/Xray-core/releases/download/${XRAY_VERSION}/Xray-linux-64.zip`;
  console.log(`[Node] Downloading Xray: ${downloadUrl}`);
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
  const template = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  const configContent = template
    .replace(/PORT_PLACEHOLDER/g, parseInt(PORT))
    .replace(/UUID_PLACEHOLDER/g, UUID);
  fs.writeFileSync('config_run.json', configContent);
}

function startXray() {
  console.log(`[Node] Starting Xray on port ${PORT}...`);
  // 注意：这里让 Xray 直接监听 PORT，处理 HTTP/WS 流量
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
