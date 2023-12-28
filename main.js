// 在 main.js 中
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// 提供 index.js 客戶端檔案
app.get('/index.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.js'));
});

// 設定靜態資源路徑
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

//使用 body-parser 中間件
app.use(bodyParser.urlencoded({ extended: true }));

const secretKey = crypto.randomBytes(32).toString('hex');

app.use(
  session({
    secret: secretKey,
    resave: true,
    saveUninitialized: true
  })
);

const uri = "mongodb+srv://coo:a627993073@chatroom.sxrqohl.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, {
  
});

// 當連接成功時執行的代碼
mongoose.connection.on('connected', () => {
  console.log('已成功連接到 MongoDB');
});

// 當連接失敗時執行的代碼
mongoose.connection.on('error', (err) => {
  console.error('連接到 MongoDB 失敗：', err);
});

// 當連接斷開時執行的代碼
mongoose.connection.on('disconnected', () => {
  console.log('與 MongoDB 的連接已斷開');
});

// 在應用程式退出時關閉連接
process.on('SIGINT', () => {
  mongoose.connection.close();
  console.log('應用程式結束，關閉與 MongoDB 的連接');
  process.exit(0);
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// 登入頁面
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 登入路由
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user) {
    return res.send('用戶不存在');
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    return res.send('密碼錯誤');
  }

  req.session.user = user;
  res.redirect('/');
});

// 登出路由
app.post('/logout', (req, res) => {
  // 清除用戶的 Session
  req.session.destroy((err) => {
    if (err) {
      console.error('登出時發生錯誤', err);
      res.status(500).send('登出失敗');
    } else {
      res.status(200).send('成功登出');
    }
  });
});

// 註冊頁面
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// 註冊路由
app.post('/register', async (req, res) => {
  const { username, password } = req.body; //
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    return res.send('用戶已存在');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    username,
    password: hashedPassword,
  });

  await newUser.save();
  res.redirect('/login');
});

// 主頁面，只有在用戶登入後才能訪問
app.get('/', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }

  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
  console.log("伺服器已啟動。請訪問 http://localhost:3000");
});
