"use strict";
// sahilchat-fca — Main Login Entry Point
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)

const utils           = require("../utils");
const setOptionsModel = require('./models/setOptions');
const buildAPIModel   = require('./models/buildAPI');
const loginHelperModel = require('./models/loginHelper');

let globalOptions = {};
let ctx           = null;
let defaultFuncs  = null;
let api           = null;

const fbLink = (ext) => ("https://www.facebook.com" + (ext ? '/' + ext : ''));
const ERROR_RETRIEVING = "Could not retrieve user ID. Your cookies may be expired or Facebook blocked the login. Try getting fresh cookies from your browser.";

/**
 * Login to Facebook using sahilchat-fca.
 *
 * @param {object} credentials
 *   - appState {string|Array} — Cookie string (recommended) or JSON cookie array
 *   - email {string} + password {string} — Email/password login
 * @param {object}   [options]  — Optional settings (logging, proxy, etc.)
 * @param {function} callback   — callback(err, api)
 *
 * @example
 * // Cookie string login (recommended):
 * login({ appState: "c_user=123; xs=abc; datr=xyz..." }, (err, api) => {
 *   if (err) return console.error(err);
 *   api.sendMessage("Hello!", threadID);
 * });
 */
async function login(credentials, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options  = {};
  }
  if (!options) options = {};

  if ('logging' in options) utils.logOptions(options.logging);

  const defaultOptions = {
    selfListen       : false,
    listenEvents     : true,
    listenTyping     : false,
    updatePresence   : false,
    forceLogin       : false,
    autoMarkDelivery : false,
    autoMarkRead     : true,
    autoReconnect    : true,
    online           : true,
    emitReady        : false,
    userAgent        : "Mozilla/5.0 (Linux; Android 12; SM-A525F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
  };
  Object.assign(globalOptions, defaultOptions, options);
  await setOptionsModel(globalOptions, options);

  loginHelperModel(
    credentials,
    globalOptions,
    (loginError, loginApi) => {
      if (loginError) return callback(loginError);
      api          = loginApi;
      ctx          = loginApi.ctx;
      defaultFuncs = loginApi.defaultFuncs;
      return callback(null, loginApi);
    },
    setOptionsModel,
    buildAPIModel,
    api,
    fbLink,
    ERROR_RETRIEVING
  );
}

module.exports = { login };
