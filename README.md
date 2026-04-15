# sahilchat-fca

```
 ____    _  _   _ ___ _     ____ _   _    _  _____   _____ ____    _
/ ___|  | || | | |_ _| |   / ___| | | |  / \|_   _| |  ___/ ___|  / \
\___ \  | || |_| || || |  | |   | |_| | / _ \ | |   | |_ | |     / _ \
 ___) | |_||  _  || || |__| |___|  _  |/ ___ \| |   |  _|| |___ / ___ \
|____/  |_||_| |_|___|_____\____|_| |_/_/   \_\_|   |_|   \____/_/   \_\
```

**Author:** [S4hiilAns4ri](https://github.com/S4hiilAns4ri)

> A Facebook Group Chat API for Node.js.
> Facebook DM / Inbox is **end-to-end encrypted (E2EE)** — no API can access it.
> This module supports **Facebook Group threads only** — all group IDs work regardless of digit length (15, 16, 17, 18, 19... any length).

---

## Installation

```bash
npm install sahilchat-fca
```

Requires **Node.js 18 or higher**.

---

## Getting Your Facebook Cookies

1. Open **facebook.com** in browser
2. Press **F12** → **Application** → **Cookies** → `https://www.facebook.com`
3. Or use the **EditThisCookie** browser extension to export as string

Cookie string looks like:
```
datr=abc123; sb=xyz; c_user=100001234567890; xs=36%3Axxx; fr=abc...
```

---

## Login

### Cookie String Login (Recommended)

```javascript
const { login } = require('sahilchat-fca');

const COOKIES = "datr=abc123; c_user=100001234567890; xs=36%3Axxx...";

login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error("Login failed:", err.message);
  console.log("Logged in! ID:", api.getCurrentUserID());
});
```

Automatically converts cookie string to internal format — nothing extra needed.

### Cookie JSON Array Login

```javascript
login({
  appState: [
    { name: "c_user", value: "100001234567890" },
    { name: "xs",     value: "36%3Axxx" },
    { name: "datr",   value: "abc123" }
  ]
}, (err, api) => {
  if (err) return console.error(err);
  console.log("Logged in!");
});
```

### Email + Password Login

```javascript
login({ email: "your@email.com", password: "yourpassword" }, (err, api) => {
  if (err) return console.error(err);
  console.log("Logged in!");
});
```

---

## Group Thread ID — Important

> **Facebook group thread IDs can be ANY digit length: 15, 16, 17, 18, 19, or more.**
> All numeric IDs are treated as group threads automatically.
> Facebook DM / Inbox uses E2EE encryption — cannot be accessed by any API.

```javascript
// All valid group thread IDs:
api.sendMessage("Hello!", "123456789012345");    // 15-digit ✅
api.sendMessage("Hello!", "1234567890123456");   // 16-digit ✅
api.sendMessage("Hello!", "12345678901234567");  // 17-digit ✅
api.sendMessage("Hello!", "123456789012345678"); // 18-digit ✅
```

---

## Send Text Message to Group

```javascript
login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error(err);

  const groupID = "1234567890123456";

  api.sendMessage("Hello everyone!", groupID, (err, info) => {
    if (err) return console.error("Failed:", err.message);
    console.log("Sent! Message ID:", info.messageID);
  });
});
```

---

## Reply to a Specific Message

```javascript
api.sendMessage("This is my reply!", groupID, messageID, (err, info) => {
  if (err) return console.error(err);
  console.log("Reply sent!");
});
```

---

## Send Sticker to Group

```javascript
api.sendMessage({ sticker: "369239263222822" }, groupID, (err, info) => {
  if (err) return console.error(err);
  console.log("Sticker sent!");
});
```

### Search Stickers by Keyword

```javascript
login({ appState: COOKIES }, async (err, api) => {
  if (err) return console.error(err);

  const results = await api.stickers.search("love");
  console.log("Found:", results.length, "stickers");

  if (results.length > 0) {
    api.sendMessage({ sticker: results[0].stickerID }, groupID);
  }
});
```

### Get Stickers from a Pack

```javascript
login({ appState: COOKIES }, async (err, api) => {
  if (err) return console.error(err);

  const packs    = await api.stickers.listPacks();
  const stickers = await api.stickers.getStickersInPack(packs[0].id);

  api.sendMessage({ sticker: stickers[0].stickerID }, groupID);
});
```

### Get AI-Generated Stickers

```javascript
const aiStickers = await api.stickers.getAiStickers({ limit: 10 });
api.sendMessage({ sticker: aiStickers[0].stickerID }, groupID);
```

### Add a Sticker Pack

```javascript
await api.stickers.addPack("227836001");
console.log("Pack added!");
```

---

## Send Attachment (Image / Video / File)

```javascript
const fs = require('fs');

// Single file
api.sendMessage(
  { attachment: fs.createReadStream('/path/to/image.jpg') },
  groupID
);

// Multiple files
api.sendMessage(
  { attachment: [
    fs.createReadStream('/path/to/image.jpg'),
    fs.createReadStream('/path/to/video.mp4')
  ]},
  groupID
);
```

---

## Send URL / Link Preview

```javascript
api.sendMessage({ url: "https://example.com" }, groupID, (err, info) => {
  if (err) return console.error(err);
  console.log("Link sent!");
});
```

---

## Send Emoji (Big)

```javascript
api.sendMessage(
  { body: "😍", emoji: "😍", emojiSize: "large" },
  groupID
);
// emojiSize: "small" | "medium" | "large"
```

---

## Mention a User in Group

```javascript
const msg = {
  body     : "Hello @Sahil how are you?",
  mentions : [{ tag: "@Sahil", id: "100001234567890" }]
};

api.sendMessage(msg, groupID, (err, info) => {
  if (err) return console.error(err);
  console.log("Mention sent!");
});
```

---

## React to a Message

```javascript
api.setMessageReaction("😍", messageID, (err) => {
  if (err) return console.error(err);
  console.log("Reacted!");
});

// Remove reaction
api.setMessageReaction("", messageID, (err) => {
  console.log("Reaction removed!");
});
```

Available emojis: `😍` `😆` `😮` `😢` `😠` `👍` `👎`

---

## Change Group Name

```javascript
login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error(err);

  api.listenMqtt((err, event) => {}); // required before group operations

  api.gcname("New Group Name", groupID)
    .then(result => console.log("Name changed!"))
    .catch(err   => console.error(err.message));
});
```

---

## Change Member Nickname

```javascript
login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error(err);

  api.listenMqtt((err, event) => {});

  api.nickname("The King", groupID, userID)
    .then(result => console.log("Nickname set!"))
    .catch(err   => console.error(err.message));
});
```

---

## Change Group Emoji

```javascript
api.listenMqtt((err, event) => {});

api.emoji("🔥", groupID)
  .then(result => console.log("Group emoji changed!"))
  .catch(err   => console.error(err.message));
```

---

## Change Group Theme / Color

```javascript
api.listenMqtt((err, event) => {});

api.theme("ROSE_GRADIENT", groupID)
  .then(result => console.log("Theme changed!"))
  .catch(err   => console.error(err.message));
```

---

## Add / Remove Group Members

```javascript
api.listenMqtt((err, event) => {});

// Add member
api.addUserToGroup("100001234567890", groupID)
  .then(() => console.log("Added!"));

// Remove member
api.removeUserFromGroup("100001234567890", groupID)
  .then(() => console.log("Removed!"));
```

---

## Change Group Admin

```javascript
api.listenMqtt((err, event) => {});

// Make user admin
api.changeGroupRule("MAKE_ADMIN", groupID, userID)
  .then(() => console.log("Admin set!"));
```

---

## Post a Comment on a Facebook Post

```javascript
login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error(err);

  const postID = "100001234_567890123"; // userID_postID format

  // Text comment
  api.createCommentPost("Great post!", postID)
    .then(result => console.log("Commented! ID:", result.id));

  // Reply to a comment
  api.createCommentPost("Nice point!", postID, commentID)
    .then(result => console.log("Replied!"));

  // Sticker comment
  api.createCommentPost({ sticker: "369239263222822" }, postID)
    .then(result => console.log("Sticker comment!"));

  // Image comment
  const fs = require('fs');
  api.createCommentPost(
    { body: "Look!", attachment: fs.createReadStream('/path/to/img.jpg') },
    postID
  ).then(result => console.log("Image comment!"));
});
```

---

## Edit a Sent Message

```javascript
api.editMessage("Updated text!", messageID, (err) => {
  if (err) return console.error(err);
  console.log("Message edited!");
});
```

---

## Unsend / Delete a Message

```javascript
api.unsendMessage(messageID, (err) => {
  if (err) return console.error(err);
  console.log("Message deleted!");
});
```

---

## Pin a Message in Group

```javascript
api.listenMqtt((err, event) => {});

api.pinMessage(messageID, groupID)
  .then(() => console.log("Message pinned!"))
  .catch(err => console.error(err.message));
```

---

## Mark Messages as Read / Delivered

```javascript
// Mark thread as read
api.markAsRead(threadID, (err) => {
  console.log("Marked as read!");
});

// Mark all threads as read
api.markAsReadAll((err) => {
  console.log("All read!");
});

// Mark as delivered
api.markAsDelivered(threadID, messageID, (err) => {
  console.log("Marked as delivered!");
});

// Mark as seen
api.markAsSeen(threadID, (err) => {
  console.log("Marked as seen!");
});
```

---

## Typing Indicator

```javascript
const stop = api.sendTypingIndicator(groupID, (err) => {
  if (err) console.error(err);
});

// Stop after 3 seconds
setTimeout(() => stop(), 3000);
```

---

## Listen for Real-time Events

```javascript
login({ appState: COOKIES }, (err, api) => {
  if (err) return console.error(err);

  const myID = api.getCurrentUserID();
  console.log("Bot running! ID:", myID);

  api.listenMqtt((err, event) => {
    if (err) return console.error(err);

    // New message
    if (event.type === "message" && event.senderID !== myID) {
      const { threadID, body, messageID, senderID } = event;
      console.log(`[${threadID}] ${senderID}: ${body}`);
      api.sendMessage("Got it!", threadID);
    }

    // Message reaction
    if (event.type === "message_reaction") {
      console.log("Reaction:", event.reaction, "on:", event.messageID);
    }

    // Group name changed
    if (event.type === "event" && event.logMessageType === "log:thread-name") {
      console.log("Group renamed to:", event.logMessageData.name);
    }

    // Member added/removed
    if (event.type === "event" && event.logMessageType === "log:subscribe") {
      console.log("Member added:", event.logMessageData.addedParticipants);
    }

    // Message edited
    if (event.type === "message_edited") {
      console.log("Message edited:", event.messageID, "→", event.body);
    }
  });
});
```

---

## Get Group / Thread Info

```javascript
const info = await api.getThreadInfo(groupID);

console.log("Name:", info.name);
console.log("Thread ID:", info.threadID);
console.log("Members:", info.userInfo.map(u => u.name));
console.log("Admin IDs:", info.adminIDs);
console.log("Total members:", info.participantIDs.length);
```

---

## Get Thread List

```javascript
const threads = await api.getThreadList(10, null, ["INBOX"]);

threads.forEach(t => {
  console.log("ID:", t.threadID, "| Name:", t.name);
});
```

---

## Get Message History

```javascript
const history = await api.getThreadHistory(groupID, 20);

history.forEach(msg => {
  console.log(`[${msg.messageID}] ${msg.senderID}: ${msg.body || "[media]"}`);
});
```

---

## Get User Info

```javascript
const info = await api.getUserInfo("100001234567890");
console.log("Name:", info["100001234567890"].name);
console.log("Pic:", info["100001234567890"].thumbSrc);
```

---

## Get Bot Info (Your Account)

```javascript
const info = await api.getBotInfo();
console.log("Name:", info.name);
console.log("ID:", info.id);
```

---

## Follow / Unfollow User

```javascript
// Follow
api.follow("100001234567890")
  .then(() => console.log("Followed!"));

// Unfollow
api.unfollow("100001234567890")
  .then(() => console.log("Unfollowed!"));
```

---

## Send Friend Request

```javascript
api.addFriend("100001234567890")
  .then(() => console.log("Friend request sent!"));
```

---

## Share a Post / Link

```javascript
api.share("https://example.com", groupID)
  .then(() => console.log("Shared!"));
```

---

## Login Options

```javascript
login({ appState: COOKIES }, {
  logging          : true,   // Console logs (default: true)
  selfListen       : false,  // Receive own messages (default: false)
  listenEvents     : true,   // All events (default: true)
  autoMarkRead     : true,   // Auto mark read (default: true)
  autoMarkDelivery : false,  // Auto mark delivered (default: false)
  autoReconnect    : true,   // Reconnect on drop (default: true)
  proxy            : "http://user:pass@host:port",
}, (err, api) => { ... });
```

---

## Full Bot Example

```javascript
const { login } = require('sahilchat-fca');

const COOKIES = "datr=abc...; c_user=100001234567890; xs=36%3Axxx...";

login({ appState: COOKIES }, { logging: false }, (err, api) => {
  if (err) return console.error("Login failed:", err.message);

  const myID = api.getCurrentUserID();
  console.log("Bot online! ID:", myID);

  api.listenMqtt(async (err, event) => {
    if (err) return console.error(err);
    if (event.type !== "message") return;
    if (event.senderID === myID) return;

    const { threadID, body, messageID } = event;
    if (!body) return;

    const cmd = body.trim().toLowerCase();

    if (cmd === "ping") {
      api.sendMessage("Pong!", threadID);

    } else if (cmd === "sticker") {
      api.sendMessage({ sticker: "369239263222822" }, threadID);

    } else if (cmd === "info") {
      const info = await api.getThreadInfo(threadID);
      api.sendMessage(
        `Group: ${info.name || "Unknown"}\nMembers: ${info.participantIDs.length}`,
        threadID
      );

    } else if (cmd === "history") {
      const msgs = await api.getThreadHistory(threadID, 5);
      const text  = msgs.map(m => `${m.senderID}: ${m.body || "[media]"}`).join("\n");
      api.sendMessage("Last 5 messages:\n" + text, threadID);

    } else if (cmd.startsWith("nick ")) {
      const nick = body.slice(5).trim();
      await api.nickname(nick, threadID, event.senderID);
      api.sendMessage(`Nickname set: ${nick}`, threadID);

    } else if (cmd.startsWith("rename ")) {
      const name = body.slice(7).trim();
      await api.gcname(name, threadID);
      api.sendMessage(`Group renamed: ${name}`, threadID);

    } else if (cmd === "react") {
      api.setMessageReaction("😍", messageID);

    } else if (cmd === "pin") {
      await api.pinMessage(messageID, threadID);
      api.sendMessage("Message pinned!", threadID);

    } else {
      api.sendMessage("You said: " + body, threadID, messageID);
    }
  });
});
```

---

## Full API Reference

| Method | What it does |
|---|---|
| `api.sendMessage(msg, threadID)` | Send to group thread (any digit length) |
| `api.sendMessage(msg, threadID, messageID)` | Reply to specific message |
| `api.sendMessage(msg, [uid1,uid2,...])` | Create new group and send |
| `api.listenMqtt(callback)` | Real-time message + event listener |
| `api.setMessageReaction(emoji, messageID)` | React to a message |
| `api.unsendMessage(messageID)` | Unsend / delete a message |
| `api.editMessage(text, messageID)` | Edit a sent message |
| `api.pinMessage(messageID, threadID)` | Pin a message |
| `api.markAsRead(threadID)` | Mark thread as read |
| `api.markAsReadAll()` | Mark all threads as read |
| `api.markAsDelivered(threadID, messageID)` | Mark as delivered |
| `api.markAsSeen(threadID)` | Mark as seen |
| `api.sendTypingIndicator(threadID)` | Show typing indicator |
| `api.gcname(name, threadID)` | Change group name |
| `api.nickname(nick, threadID, userID)` | Change member nickname |
| `api.emoji(emoji, threadID)` | Change group emoji |
| `api.theme(theme, threadID)` | Change group theme/color |
| `api.addUserToGroup(userID, threadID)` | Add member to group |
| `api.removeUserFromGroup(userID, threadID)` | Remove member from group |
| `api.changeGroupRule(rule, threadID, userID)` | Change admin / group rules |
| `api.createCommentPost(msg, postID)` | Post comment on a post |
| `api.createCommentPost(msg, postID, commentID)` | Reply to a comment |
| `api.getThreadInfo(threadID)` | Get group info and members |
| `api.getThreadList(limit, cursor, folder)` | Get thread list |
| `api.getThreadHistory(threadID, count)` | Get message history |
| `api.getUserInfo(userID)` | Get user profile info |
| `api.getBotInfo()` | Get your own account info |
| `api.getCurrentUserID()` | Get your user ID |
| `api.getAppState()` | Get current session cookies |
| `api.follow(userID)` | Follow a user |
| `api.unfollow(userID)` | Unfollow a user |
| `api.addFriend(userID)` | Send friend request |
| `api.share(url, threadID)` | Share a link |
| `api.logout()` | Logout and invalidate session |
| `api.stickers.search(query)` | Search stickers |
| `api.stickers.listPacks()` | List sticker packs |
| `api.stickers.getStickersInPack(packID)` | Get stickers in pack |
| `api.stickers.getAiStickers({limit})` | Get AI stickers |
| `api.stickers.addPack(packID)` | Add sticker pack |

---

## Credits

- **Author:** [S4hiilAns4ri](https://github.com/S4hiilAns4ri)
- **Version:** 1.0.0
- **License:** MIT
