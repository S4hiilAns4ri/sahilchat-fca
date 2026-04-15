"use strict";

const { login } = require('./module/index');
const readline  = require('readline');

function ask(rl, q) {
  return new Promise(res => rl.question(q, ans => res(ans)));
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let running = false;
let rl;

process.on('SIGINT', () => {
  running = false;
  console.log('\n\n[STOP] Ruk gaya.');
  setTimeout(() => process.exit(0), 600);
});

async function commentLoop(api, postID, text, speed) {
  running = true;
  let count = 0;
  console.log('\n[START] Comment chal raha hai... Ctrl+C se rokna\n');
  while (running) {
    try {
      await api.createCommentPost(text, postID);
      count++;
      process.stdout.write(`\r[${count}] Comment done`);
    } catch(e) {
      console.log(`\n[ERR] ${e.message}`);
    }
    await sleep(speed * 1000);
  }
}

async function groupMsgLoop(api, threadID, text, speed) {
  running = true;
  let count = 0;
  console.log('\n[START] Message chal raha hai... Ctrl+C se rokna\n');
  while (running) {
    try {
      await new Promise((res, rej) => {
        api.sendMessage(text, threadID, (err) => err ? rej(err) : res());
      });
      count++;
      process.stdout.write(`\r[${count}] Message sent`);
    } catch(e) {
      console.log(`\n[ERR] ${e.message}`);
    }
    await sleep(speed * 1000);
  }
}

async function main() {
  console.log('====================================');
  console.log('   sahilchat-fca — Spammer Tool     ');
  console.log('   By S4hiilAns4ri                  ');
  console.log('====================================\n');

  // ── Sab input pehle lelo ─────────────────────────
  rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const cookies = (await ask(rl, 'Cookies paste karo:\n> ')).trim();
  if (!cookies) { console.log('[ERR] Cookies empty!'); rl.close(); process.exit(1); }

  console.log('\n--- Feature Select ---');
  console.log('[1] Post Comment  — kisi bhi FB post pe baar baar comment');
  console.log('[2] Group Message — group me baar baar message');
  const choice = (await ask(rl, '\nChoice (1 ya 2): ')).trim();

  let postID, threadID, text, speed;

  if (choice === '1') {
    postID = (await ask(rl, 'Post UID dalo: ')).trim();
    text   = (await ask(rl, 'Comment text dalo: ')).trim();
    speed  = parseFloat(await ask(rl, 'Speed (seconds, e.g. 2): ')) || 2;
    if (!postID || !text) { console.log('[ERR] Post ID ya comment empty!'); rl.close(); process.exit(1); }
  } else if (choice === '2') {
    threadID = (await ask(rl, 'Group Thread ID dalo: ')).trim();
    text     = (await ask(rl, 'Message dalo: ')).trim();
    speed    = parseFloat(await ask(rl, 'Speed (seconds, e.g. 2): ')) || 2;
    if (!threadID || !text) { console.log('[ERR] Thread ID ya message empty!'); rl.close(); process.exit(1); }
  } else {
    console.log('[ERR] 1 ya 2 dalo.'); rl.close(); process.exit(1);
  }

  // ── Input lene ke baad readline close karo ────────
  rl.close();

  // ── Ab login karo ─────────────────────────────────
  console.log('\n[...] Login ho raha hai...');
  login({ appState: cookies }, { logging: false }, async (err, api) => {
    if (err) { console.log('[FAIL] Login failed:', err.message); process.exit(1); }
    console.log('[OK] Login! ID:', api.getCurrentUserID());

    if (choice === '1') {
      await commentLoop(api, postID, text, speed);
    } else {
      await groupMsgLoop(api, threadID, text, speed);
    }
  });
}

main().catch(e => { console.error('[ERR]', e.message); process.exit(1); });
