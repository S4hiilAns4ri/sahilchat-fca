<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=58a6ff&height=120&section=header&text=sahilchat-fca&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38" width="100%"/>

[![npm version](https://img.shields.io/npm/v/sahilchat-fca?style=for-the-badge&color=58a6ff&labelColor=0d1117&logo=npm)](https://www.npmjs.com/package/sahilchat-fca)
[![npm downloads](https://img.shields.io/npm/dt/sahilchat-fca?style=for-the-badge&color=cb3837&labelColor=0d1117&logo=npm)](https://www.npmjs.com/package/sahilchat-fca)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge&labelColor=0d1117)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js->=14-339933?style=for-the-badge&logo=nodedotjs&labelColor=0d1117)](https://nodejs.org)
[![Author](https://img.shields.io/badge/Author-S4hiilAns4ri-blueviolet?style=for-the-badge&logo=github&labelColor=0d1117)](https://github.com/S4hiilAns4ri)

**Facebook Chat API for Node.js** — Cookie login · Group messaging · Comment automation · MQTT listener

</div>

---

## ✨ Features

| Feature | Status |
|--------|--------|
| 🍪 Cookie-string login (no email/pass) | ✅ |
| 💬 Send messages to groups | ✅ |
| 📝 Post comments on Facebook posts | ✅ |
| 👥 Add users to groups | ✅ |
| ℹ️ Get logged-in account info | ✅ |
| 🔄 Real-time MQTT listener | ✅ |
| ↩️ Reply to messages (thread) | ✅ |
| ⏳ Promise & callback support | ✅ |

---

## 📦 Installation

```bash
npm install sahilchat-fca
```

---

## 🚀 Quick Start

```js
const login = require('sahilchat-fca');

const cookies = 'c_user=YOUR_C_USER; xs=YOUR_XS; ...'; // paste cookie string

login({ cookie: cookies }, (err, api) => {
  if (err) return console.error('Login failed:', err);

  // Get your account info
  api.getBotInfo((info) => {
    console.log(`Logged in as: ${info.name} (${info.userID})`);
  });

  // Send a message to a group
  api.sendMessage('Hello from sahilchat-fca! 🔥', 'GROUP_ID', (err) => {
    if (!err) console.log('Message sent!');
  });

  // Comment on a post
  api.createCommentPost('POST_ID', 'Nice post! 👑', (err, res) => {
    if (!err) console.log('Comment posted!');
  });
});
```

---

## 📖 API Reference

### `login(options, callback)`
```js
login({ cookie: 'your_cookie_string' }, (err, api) => { ... })
```

---

### `api.sendMessage(message, threadID, [callback])`
```js
// With callback
api.sendMessage('Hello!', '1234567890123456', (err) => { ... });

// With await (Promise)
await api.sendMessage('Hello!', '1234567890123456');

// Reply to a message
api.sendMessage('Replying!', threadID, callback, messageID);
```

---

### `api.createCommentPost(postID, message, callback)`
```js
api.createCommentPost('POST_ID', 'Great post! 🔥', (err, res) => {
  if (!err) console.log('Commented!');
});
```

---

### `api.getBotInfo(callback)`
```js
api.getBotInfo((info) => {
  console.log(info.name);    // "Sahil Ansari"
  console.log(info.userID);  // "61570786433307"
  console.log(info.profileURL);
});
```

---

### `api.addUserToGroup(userID, groupID, callback)`
```js
api.addUserToGroup('USER_ID', 'GROUP_ID', (err) => {
  if (!err) console.log('User added!');
});
```

---

### `api.listenMqtt(callback)`
```js
api.listenMqtt((err, message) => {
  if (err) return console.error(err);
  console.log(`[${message.threadID}] ${message.body}`);
});
```

---

## 🍪 How to Get Cookies

1. Open **Facebook** in Chrome
2. Press `F12` → **Application** tab → **Cookies** → `facebook.com`
3. Copy all cookies as a string: `c_user=...; xs=...; fr=...;`
4. Paste into `login({ cookie: '...' })`

---

## ⚠️ Notes

- Only **Group threads** are supported (Facebook deprecated DM API)
- Use responsibly — automation may violate Facebook TOS
- Made for **educational purposes only**

---

## 🔧 Built With

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![npm](https://img.shields.io/badge/npm-CB3837?style=flat-square&logo=npm&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-MQTT-010101?style=flat-square)
![Facebook](https://img.shields.io/badge/Facebook-API-1877F2?style=flat-square&logo=facebook&logoColor=white)

---

<div align="center">

**Made with ❤️ by [S4hiilAns4ri](https://github.com/S4hiilAns4ri)**

*"Code karo, king bano 👑"*

<img src="https://capsule-render.vercel.app/api?type=waving&color=58a6ff&height=80&section=footer" width="100%"/>

</div>
