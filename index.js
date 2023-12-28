// 在 index.js 中
import express from './express';
import path from './path';
import http from './http';
import socketIO from './socket.io';
import mongoose from './mongoose';

// 創建一個 Express 應用
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// 使用 express.static 中介軟體設置靜態文件夾
app.use(express.static(path.join(__dirname, 'public')));

// 連接到 MongoDB 數據庫
mongoose.connect("mongodb+srv://coo:a627993073@chatroom.sxrqohl.mongodb.net/?retryWrites=true&w=majority")

// 創建 Socket.IO 連接
const socket = io();

// 初始化線上人數
let onlineCount = 0;

// 監聽連接事件
socket.on('connect', () => {
  console.log('Connected to the server');
});

// 監聽線上人數事件
socket.on('online', (count) => {
  onlineCount = count;
  document.getElementById('online').innerText = onlineCount;
});

// 監聽最大紀錄事件
socket.on('maxRecord', (maxRecord) => {
  console.log('Max Record:', maxRecord);
});

// 監聽聊天紀錄事件
socket.on('chatRecord', (msgs) => {
  console.log('Chat Record:', msgs);
  // 在這裡更新你的瀏覽器界面，例如將消息顯示在網頁上
});

// 監聽送出表單事件
document.getElementById('send-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const msgInput = document.getElementById('msg');
  const msg = msgInput.value.trim();
  if (msg !== '') {
    socket.emit('send', msg);
    msgInput.value = '';
  }
});

// records.js 的內容
const chatRecordSchema = new mongoose.Schema({
  name: String,
  msg: String,
  time: String
});

const ChatRecord = mongoose.model("ChatRecord", chatRecordSchema);

let MAX = 1000000000000000000000000000000000000000000000000000000000000n;

class Records {
  constructor() {
    this.eventListeners = {};
  }

  on(eventName, listener) {
    if (!this.eventListeners[eventName]) {
      this.eventListeners[eventName] = [];
    }
    this.eventListeners[eventName].push(listener);
  }

  emit(eventName, ...args) {
    if (this.eventListeners[eventName]) {
      this.eventListeners[eventName].forEach(listener => listener(...args));
    }
  }

  async push(msg) {
    const record = new ChatRecord(msg);
    await record.save();

    this.emit("new_message", msg);

    const count = await ChatRecord.countDocuments();
  
    if (count >= MAX) {
      const oldestRecord = await ChatRecord.findOne().sort({ time: 1 });
      await ChatRecord.findByIdAndDelete(oldestRecord._id);
    }
  }

  async get(callback) {
    const records = await ChatRecord.find();
    callback(records);
  }

  setMax(max) {
    MAX = max;
  }

  getMax() {
    return MAX;
  }
}

// 實例化 Records 類別，並將其附加到全局作用域中
window.records = new Records();
