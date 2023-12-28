//import mongoose from 'mongoose.js';

const chatRecordSchema = new mongoose.Schema({
  name: String,
  msg: String,
  time: String
});

const ChatRecord = mongoose.model("ChatRecord", chatRecordSchema);

let MAX = 1000000000000000000000000000000000000000000000000000000000000;

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

// 實例化 Records 類別，並導出
const instance = new Records();
export default instance;
