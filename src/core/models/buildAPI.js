"use strict";
// sahilchat-fca — Build API Context
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)

const utils = require('../../utils');

/**
 * Builds the API context and default functions after successful cookie setup.
 * Extracts userID, fb_dtsg token, MQTT config from Facebook's HTML.
 */
async function buildAPI(html, jar, netData, globalOptions, fbLinkFunc, errorRetrievingMsg) {

  // ── Get userID from cookie jar ──────────────────────
  let userID;
  const checkUrls = [fbLinkFunc(), "https://www.facebook.com", "https://www.facebook.com/"];
  let cookies = [];
  for (const url of checkUrls) {
    try {
      cookies = jar.getCookiesSync(url);
      if (cookies.length > 0) break;
    } catch(e) {}
  }

  const primaryProfile   = cookies.find(v => v.cookieString().startsWith("c_user="));
  const secondaryProfile = cookies.find(v => v.cookieString().startsWith("i_user="));

  if (!primaryProfile && !secondaryProfile) {
    // Fallback: try to extract from HTML
    const htmlMatch = html.match(/"USER_ID"\s*:\s*"(\d+)"/)
                   || html.match(/c_user=(\d+)/)
                   || html.match(/"userID"\s*:\s*"(\d+)"/);
    if (htmlMatch) {
      userID = htmlMatch[1];
      utils.log("User ID extracted from HTML:", userID);
    } else {
      throw new Error(errorRetrievingMsg + " Your cookies may be expired. Please get fresh cookies from your browser.");
    }
  } else {
    userID = secondaryProfile?.cookieString().split("=")[1] || primaryProfile.cookieString().split("=")[1];
  }

  utils.log("User ID found:", userID);

  // ── Find config values in netData JSON blobs ────────
  const findConfig = (key) => {
    for (const scriptData of netData) {
      if (!scriptData.require) continue;
      for (const req of scriptData.require) {
        if (Array.isArray(req) && req[0] === key && req[2]) return req[2];
        if (Array.isArray(req) && req[3]?.[0]?.__bbox?.define) {
          for (const def of req[3][0].__bbox.define) {
            if (Array.isArray(def) && def[0].endsWith(key) && def[2]) return def[2];
          }
        }
      }
    }
    return null;
  };

  // ── Extract fb_dtsg token (multiple fallbacks) ──────
  const dtsgData = findConfig("DTSGInitialData");
  let dtsg = dtsgData?.token
    || utils.getFrom(html, '"token":"', '"')
    || utils.getFrom(html, 'name="fb_dtsg" value="', '"')
    || utils.getFrom(html, '"dtsg":{"token":"', '"')
    || "";

  if (!dtsg) utils.warn("fb_dtsg token not found. Some features may not work.");

  const dtsgResult = {
    fb_dtsg  : dtsg,
    jazoest  : `2${Array.from(dtsg).reduce((a, b) => a + b.charCodeAt(0), '')}`,
  };

  // ── MQTT / App config ───────────────────────────────
  const clientIDData   = findConfig("MqttWebDeviceID");
  const clientID       = clientIDData?.clientID || utils.getGUID();

  const mqttConfigData = findConfig("MqttWebConfig");
  const mqttAppID      = mqttConfigData?.appID;

  const currentUserData = findConfig("CurrentUserInitialData");
  const userAppID       = currentUserData?.APP_ID;

  const primaryAppID   = userAppID || mqttAppID;
  let mqttEndpoint     = mqttConfigData?.endpoint;
  let region           = mqttEndpoint ? new URL(mqttEndpoint).searchParams.get("region")?.toUpperCase() : undefined;

  const irisSeqIDMatch = html.match(/irisSeqID:"(.+?)"/);
  const irisSeqID      = irisSeqIDMatch?.[1] || null;

  if (globalOptions.bypassRegion && mqttEndpoint) {
    const ep = new URL(mqttEndpoint);
    ep.searchParams.set('region', globalOptions.bypassRegion.toLowerCase());
    mqttEndpoint = ep.toString();
    region       = globalOptions.bypassRegion.toUpperCase();
  }

  const ctx = {
    userID,
    jar,
    clientID,
    appID            : primaryAppID,
    mqttAppID,
    userAppID,
    globalOptions,
    loggedIn         : true,
    access_token     : "NONE",
    clientMutationId : 0,
    mqttClient       : undefined,
    lastSeqId        : irisSeqID,
    syncToken        : undefined,
    mqttEndpoint,
    wsReqNumber      : 0,
    wsTaskNumber     : 0,
    reqCallbacks     : {},
    callback_Task    : {},
    region,
    firstListen      : true,
    ...dtsgResult,
  };

  const defaultFuncs = utils.makeDefaults(html, userID, ctx);
  return [ctx, defaultFuncs, {}];
}

module.exports = buildAPI;
