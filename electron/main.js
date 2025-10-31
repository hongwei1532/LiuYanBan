import { app, BrowserWindow, ipcMain } from "electron"
import url from 'url'
import path from 'path'
import { fork } from 'child_process'
import fs from 'fs'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const keytar = require('keytar')

let __filename = url.fileURLToPath(import.meta.url)
let __dirname = path.dirname(__filename)

const SERVICE_NAME = 'liuyan-db'

function getConfigPath(){
  return path.join(app.getPath('userData'), 'config.json')
}

function getServerPath(){
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'app', 'src', 'server', 'index.cjs')
  } else {
    return path.resolve(__dirname, '../src/server/index.cjs')
  }
}

async function readConfig(){
  const cfgPath = getConfigPath()
  if (!fs.existsSync(cfgPath)) return null
  try{
    const raw = fs.readFileSync(cfgPath, 'utf-8')
    const cfg = JSON.parse(raw)
    const password = await keytar.getPassword(SERVICE_NAME, cfg.user || cfg.DB_USER || 'default')
    return { host: cfg.host, user: cfg.user, dbName: cfg.dbName, password }
  }catch{ return null }
}

async function showSetupWindow(){
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 520,
      height: 460,
      resizable: false,
      title: '首次运行配置',
      autoHideMenuBar: true,
      webPreferences: {
        contextIsolation: true,
        preload: path.resolve(__dirname, 'preload.mjs')
      }
    })
    const html = `<!doctype html><html><head><meta charset="utf-8"/><title>首次运行配置</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; margin:0;padding:24px;background:#f6f8fa;} .card{background:#fff;border:1px solid #eaecef;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.04);padding:20px;} h2{margin:0 0 12px;font-size:20px} label{display:block;font-size:13px;color:#6a737d;margin:10px 0 6px} input{width:100%;height:36px;border:1px solid #d0d7de;border-radius:8px;padding:0 10px;outline:none} .row{margin-bottom:6px} button{margin-top:14px;height:36px;background:#409eff;border:none;color:#fff;border-radius:8px;cursor:pointer;width:100%} .tip{font-size:12px;color:#6a737d;margin-top:8px}</style>
</head><body><div class="card"><h2>数据库配置</h2>
<label>主机</label><input id="host" placeholder="例如 localhost"/>
<label>用户名</label><input id="user" placeholder="例如 root"/>
<label>密码</label><input id="password" type="password" placeholder="数据库密码"/>
<label>数据库名</label><input id="db" placeholder="例如 message_board"/>
<button id="save">保存并继续</button>
<div class="tip">提示：密码将安全存储到本机凭据库（Keytar）。</div>
</div>
<script>
  document.getElementById('save').onclick = async () => {
    const cfg = { host: host.value.trim(), user: user.value.trim(), password: password.value, dbName: db.value.trim() }
    if(!cfg.host||!cfg.user||!cfg.password||!cfg.dbName){ alert('请填写完整'); return }
    try{ await window.electronAPI.saveConfig(cfg); }catch(e){ alert('保存失败:'+e.message); return }
  }
</script></body></html>`
    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

    ipcMain.handleOnce('setup:save-config', async (_e, payload) => {
      const { host, user, password, dbName } = payload || {}
      const cfgPath = getConfigPath()
      fs.mkdirSync(path.dirname(cfgPath), { recursive: true })
      fs.writeFileSync(cfgPath, JSON.stringify({ host, user, dbName }, null, 2), 'utf-8')
      await keytar.setPassword(SERVICE_NAME, user, password)
      win.close()
      resolve()
      return 'ok'
    })
  })
}

async function ensureConfig(){
  const existing = await readConfig()
  if (!existing) { await showSetupWindow() }
}

function forkServerWithEnv(){
  readConfig().then(cfg => {
    const env = Object.assign({}, process.env, {
      DB_HOST: cfg?.host,
      DB_USER: cfg?.user,
      DB_PASSWORD: cfg?.password,
      DB_NAME: cfg?.dbName
    })
    const serverPath = getServerPath()
    console.log('准备fork服务端脚本：', serverPath)
    const child = fork(serverPath, { env })
    child.on('error', (err) => { console.error('服务端子进程启动失败:', err) })
    child.on('exit', (code, signal) => { console.error('服务端子进程退出:', code, signal) })
  })
}

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        icon: "electron/resource/images/code.ico",
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.resolve(__dirname, "preload.mjs"),
        }
    })

    if(process.env['VITE_DEV_SERVER_URL']){
        mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL'])
    }else{
        mainWindow.loadFile(path.resolve(__dirname, "../dist/index.html"))
    }
}

app.whenReady().then(async () => {
  await ensureConfig()
  forkServerWithEnv()
  createWindow()
})