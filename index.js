const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// 1. 环境变量
const PORT = process.env.PORT || 8080;
const PASSWORD = process.env.PASSWORD || 'my-secure-password';
const VERSION = '1.8.8'; // Sing-box 版本
// Linux AMD64 下载地址 (.tar.gz)
const DOWNLOAD_URL = `https://github.com/SagerNet/sing-box/releases/download/v${VERSION}/sing-box-${VERSION}-linux-amd64.tar.gz`;

function downloadAndInstall() {
  if (!fs.existsSync('sing-box')) {
    console.log(`[Node] Downloading Sing-box from: ${DOWNLOAD_URL}`);
    
    try {
      // 1. 使用 curl 下载
      execSync(`curl -L -o sing-box.tar.gz "${DOWNLOAD_URL}"`);
      
      // 2. 使用系统 tar 命令解压 (.tar.gz)
      console.log('[Node] Extracting .tar.gz...');
      execSync('tar -xzf sing-box.tar.gz');
      
      // 3. 移动文件 (解压后通常在一个子文件夹里，需要找出来移到根目录)
      // 也就是把 sing-box-1.8.8-linux-amd64/sing-box 移动到 ./sing-box
      console.log('[Node] Locating binary...');
      
      // 简单粗暴：查找当前目录下所有名为 sing-box 的文件，排除压缩包
      const findCmd = `find . -type f -name "sing-box" ! -name "*.tar.gz" -exec mv {} . \\;`;
      execSync(findCmd);
      
      // 4. 赋予执行权限
      execSync('chmod +x sing-box');
      
      // 5. 清理压缩包
      execSync('rm -rf sing-box.tar.gz sing-box-*-linux-amd64');
      
      console.log('[Node] Sing-box installed successfully.');
    } catch (error) {
      console.error('[Node] Install failed:', error.message);
      process.exit(1);
    }
  }
}

function generateConfig() {
  console.log(`[Node] Generating Config. Port: ${PORT}, Type: Trojan`);
  
  // 读取模板
  let config = fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8');
  
  // 替换变量
  // 注意：config.json 里 PORT_PLACEHOLDER 没有引号，我们直接替换为数字
  // 但为了正则方便，我们可以把模板里的 "listen_port": PORT_PLACEHOLDER 
  // 这种结构处理好。最简单的办法是字符串硬替换。
  
  config = config.replace(/PORT_PLACEHOLDER/g, parseInt(PORT));
  config = config.replace(/PASSWORD_PLACEHOLDER/g, PASSWORD);
  
  fs.writeFileSync('config_run.json', config);
}

function startSingbox() {
  console.log('[Node] Starting Sing-box Core...');
  // 启动
  const child = spawn('./sing-box', ['run', '-c', 'config_run.json'], { stdio: 'inherit' });
  
  child.on('error', (err) => console.error('[Node] Process error:', err));
  child.on('exit', (code) => {
    console.log(`[Node] Exited with code ${code}`);
    process.exit(code);
  });
}

// 主流程
try {
  downloadAndInstall();
  generateConfig();
  startSingbox();
} catch (e) {
  console.error(e);
  process.exit(1);
}
