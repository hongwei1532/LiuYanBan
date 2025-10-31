const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db.cjs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 用户注册
app.post('/api/register', async (req, res) => {
  const { Username, Password } = req.body;
  if (!Username || !Password) return res.json({ success: false, message: '用户名和密码不能为空' });
  try {
    await pool.query('INSERT INTO userTable (Username, Password) VALUES (?, ?)', [Username, Password]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '数据库错误' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  const { Username, Password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM userTable WHERE Username=? AND Password=?', [Username, Password]);
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.json({ success: false, message: '用户名或密码错误' });
    }
  } catch (e) {
    res.status(500).json({ success: false, message: '数据库错误' });
  }
});

// 获取所有留言
app.get('/api/messages', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT lyTable.*, userTable.Username FROM lyTable JOIN userTable ON lyTable.userId = userTable.id ORDER BY lyTable.date DESC`
    );
    res.json({ success: true, messages: rows });
  } catch (e) {
    res.status(500).json({ success: false, message: '数据库错误' });
  }
});

// 发布留言
app.post('/api/messages', async (req, res) => {
  const { userId, title, content } = req.body;
  if (!userId) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const now = new Date();
    await pool.query('INSERT INTO lyTable (userId, date, title, content) VALUES (?, ?, ?, ?)', [userId, now, title, content]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, message: '数据库错误' });
  }
});

// 启动端口
app.listen(3030, () => {
  console.log('留言板后端服务启动，端口3030');
});
