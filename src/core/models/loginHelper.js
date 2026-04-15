"use strict";
// sahilchat-fca — Login Helper
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)
// Supports: cookie string (auto-convert), cookie JSON array, email+password

const utils  = require('../../utils');
const axios  = require("axios");
const path   = require('path');
const fs     = require('fs');
const qs     = require("querystring");

/**
 * Converts a raw cookie string into an array of {name, value} objects.
 * Example input:  "c_user=123; xs=abc; datr=xyz"
 * Example output: [{name:"c_user", value:"123"}, {name:"xs", value:"abc"}, ...]
 * @param {string} str - Raw cookie string
 * @returns {Array<{name:string, value:string}>}
 */
function cookieStringToArray(str) {
  return str.split(';')
    .map(s => s.trim())
    .filter(Boolean)
    .map(pair => {
      const idx = pair.indexOf('=');
      if (idx === -1) return null;
      return { name: pair.slice(0, idx).trim(), value: pair.slice(idx + 1).trim() };
    })
    .filter(Boolean);
}

/**
 * Main login orchestrator for sahilchat-fca.
 * Handles cookie string, JSON array cookies, and email+password login.
 */
async function loginHelper(credentials, globalOptions, callback, setOptionsFunc, buildAPIFunc, initialApi, fbLinkFunc, errorRetrievingMsg) {
  let ctx = null;
  let defaultFuncs = null;
  let api = initialApi;

  try {
    const jar = utils.getJar();
    utils.log("sahilchat-fca — Starting login...");

    const appState = credentials.appState;

    if (appState) {
      let cookieArray = [];

      if (typeof appState === 'string') {
        // ── Cookie string → auto-convert to array ──────
        cookieArray = cookieStringToArray(appState);
        utils.log(`Cookie string detected — converted ${cookieArray.length} cookies to JSON`);
      } else if (Array.isArray(appState)) {
        // ── Already a JSON array ────────────────────────
        cookieArray = appState;
        utils.log(`Cookie JSON array detected — ${cookieArray.length} cookies loaded`);
      } else {
        throw new Error("Invalid appState format. Provide a cookie string (e.g. 'c_user=123; xs=abc') or a JSON array ([{name:'c_user', value:'123'}]).");
      }

      if (cookieArray.length === 0) {
        throw new Error("No cookies found. Please provide valid cookies.");
      }

      // ── Set all cookies into the jar ──────────────────
      const domain  = ".facebook.com";
      const expires = new Date().getTime() + 1000 * 60 * 60 * 24 * 365;
      cookieArray.forEach(c => {
        const name  = (c.name  || c.key   || '').trim();
        const value = (c.value || c.val   || '').trim();
        if (!name) return;
        const str = `${name}=${value}; expires=${expires}; domain=${domain}; path=/;`;
        try { jar.setCookie(str, `https://${domain}`); } catch(e) {}
        try { jar.setCookie(str, `https://www.facebook.com`); } catch(e) {}
      });

      utils.log("Cookies set in jar successfully.");

    } else if (credentials.email && credentials.password) {
      // ── Email + Password login ────────────────────────
      utils.log("Logging in with email and password...");
      const url    = "https://b-api.facebook.com/method/auth.login";
      const params = {
        access_token             : "350685531728|62f8ce9f74b12f84c123cc23437a4a32",
        format                   : "json",
        sdk_version              : 2,
        email                    : credentials.email,
        locale                   : "en_US",
        password                 : credentials.password,
        generate_session_cookies : 1,
        sig                      : "c1c640010993db92e5afd11634ced864",
      };
      try {
        const resp = await axios.get(`${url}?${qs.stringify(params)}`);
        if (!resp.data || !resp.data.session_cookies) {
          throw new Error("Login failed. Check your email and password.");
        }
        const domain  = ".facebook.com";
        const expires = new Date().getTime() + 1000 * 60 * 60 * 24 * 365;
        resp.data.session_cookies.forEach(c => {
          const str = `${c.name}=${c.value}; expires=${expires}; domain=${domain}; path=/;`;
          try { jar.setCookie(str, `https://${domain}`); } catch(e) {}
        });
        utils.log("Email/password login successful.");
      } catch (e) {
        throw new Error("Email or password is incorrect. Error: " + e.message);
      }
    } else {
      throw new Error("No credentials provided. Please pass appState (cookie string or array) or email+password.");
    }

    // ── Build base API object ─────────────────────────
    if (!api) {
      api = {
        setOptions: setOptionsFunc.bind(null, globalOptions),
        getAppState() {
          const state  = utils.getAppState(jar);
          if (!Array.isArray(state)) return [];
          const unique = state.filter((item, idx, self) => self.findIndex(t => t.key === item.key) === idx);
          return unique.length > 0 ? unique : state;
        },
      };
    }

    // ── Connect to Facebook (multiple endpoint fallback) ─
    utils.log("Connecting to Facebook...");
    let resp     = null;
    const tryUrls = [
      "https://www.facebook.com/",
      "https://www.facebook.com/home.php",
      "https://mbasic.facebook.com/",
    ];

    for (const url of tryUrls) {
      try {
        resp = await utils.get(url, jar, null, globalOptions, { noRef: true }).then(utils.saveCookies(jar));
        if (resp && resp.body && resp.body.length > 500) {
          utils.log("Connected via:", url);
          break;
        }
      } catch (e) {
        utils.warn(`Endpoint ${url} failed, trying next...`);
      }
    }

    if (!resp || !resp.body) {
      throw new Error("Could not connect to Facebook. Check your internet connection and cookies.");
    }

    // ── Extract JSON data from HTML scripts ───────────
    const extractNetData = (html) => {
      const results    = [];
      const scriptRegex = /<script type="application\/json"[^>]*>(.*?)<\/script>/g;
      let match;
      while ((match = scriptRegex.exec(html)) !== null) {
        try { results.push(JSON.parse(match[1])); } catch (e) {}
      }
      return results;
    };
    const netData = extractNetData(resp.body);

    const [newCtx, newDefaultFuncs] = await buildAPIFunc(resp.body, jar, netData, globalOptions, fbLinkFunc, errorRetrievingMsg);
    ctx           = newCtx;
    defaultFuncs  = newDefaultFuncs;
    api.message   = new Map();
    api.timestamp = {};

    // ── Load all API modules from deltas/apis ─────────
    const loadApiModules = () => {
      const apiPath    = path.join(__dirname, '..', '..', 'deltas', 'apis');
      const apiFolders = fs.readdirSync(apiPath)
        .filter(name => fs.lstatSync(path.join(apiPath, name)).isDirectory());

      apiFolders.forEach(folder => {
        const folderPath = path.join(apiPath, folder);
        fs.readdirSync(folderPath)
          .filter(file => file.endsWith('.js'))
          .forEach(file => {
            const moduleName = path.basename(file, '.js');
            const fullPath   = path.join(folderPath, file);
            try {
              api[moduleName] = require(fullPath)(defaultFuncs, api, ctx);
            } catch (e) {
              utils.error(`Failed to load module: ${moduleName} —`, e.message);
            }
          });
      });

      // MQTT modules
      const realtimePath = path.join(apiPath, 'mqtt', 'realtime.js');
      const listenPath   = path.join(apiPath, 'mqtt', 'listenMqtt.js');
      if (fs.existsSync(realtimePath)) api['realtime']   = require(realtimePath)(defaultFuncs, api, ctx);
      if (fs.existsSync(listenPath))   api['listenMqtt'] = require(listenPath)(defaultFuncs, api, ctx);
    };

    api.getCurrentUserID = () => ctx.userID;
    api.getOptions       = (key) => key ? globalOptions[key] : globalOptions;
    loadApiModules();

    // ── Friendly aliases (file names vs user-facing method names) ─────────
    // comment.js → api.comment, expose as createCommentPost
    if (api.comment) api.createCommentPost = api.comment;

    // gcmember.js → api.gcmember(action, [userIDs], threadID)
    // expose as addUserToGroup / removeUserFromGroup
    if (api.gcmember) {
      api.addUserToGroup      = (userID, threadID, cb) => api.gcmember('add',    [userID], threadID, cb);
      api.removeUserFromGroup = (userID, threadID, cb) => api.gcmember('remove', [userID], threadID, cb);
    }

    // gcrule.js → expose as changeGroupRule
    if (api.gcrule) api.changeGroupRule = api.gcrule;

    // pinMessage from mqtt folder
    if (api.pinMessage)     api.pinMessage     = api.pinMessage;

    api.ctx           = ctx;
    api.defaultFuncs  = defaultFuncs;
    api.globalOptions = globalOptions;

    utils.log(`Login successful! User ID: ${ctx.userID}`);
    return callback(null, api);

  } catch (error) {
    utils.error("Login failed:", error.message || error);
    return callback(error);
  }
}

module.exports = loginHelper;
