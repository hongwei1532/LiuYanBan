const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// 加载 .env：优先 resources/app/.env -> 其次 resources/.env -> 最后项目根目录 .env
(() => {
  try {
    if (process.resourcesPath) {
      const envInApp = path.join(process.resourcesPath, 'app', '.env');
      const envInRoot = path.join(process.resourcesPath, '.env');
      if (fs.existsSync(envInApp)) {
        dotenv.config({ path: envInApp });
        return;
      }
      if (fs.existsSync(envInRoot)) {
        dotenv.config({ path: envInRoot });
        return;
      }
    }
  } catch (_) {}
  // 开发环境或未打包场景
  const localEnv = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(localEnv)) {
    dotenv.config({ path: localEnv });
  } else {
    dotenv.config();
  }
})();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'liuyan',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;