"use strict";
// sahilchat-fca — GetBotInfo
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)

const utils = require('../../../utils');

module.exports = (defaultFuncs, api, ctx) => {
  /**
   * Returns bot's current login info, tokens, and context accessor functions.
   * @param {Array<object>} netData - JSON blobs extracted from Facebook HTML
   * @returns {object|null}
   */
  return function GetBotInfo(netData) {
    if (!netData || !Array.isArray(netData)) {
      utils.error("GetBotInfo", "netData is not a valid array.");
      return null;
    }

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

    const currentUserData = findConfig("CurrentUserInitialData");
    const dtsgInitialData = findConfig("DTSGInitialData");
    const dtsgInitData    = findConfig("DTSGInitData");
    const lsdData         = findConfig("LSD");

    if (!currentUserData || !dtsgInitialData) {
      utils.error("GetBotInfo", "Could not find required data (CurrentUserInitialData or DTSGInitialData).");
      return null;
    }

    return {
      name      : currentUserData.NAME,
      firstName : currentUserData.SHORT_NAME,
      uid       : currentUserData.USER_ID,
      appID     : currentUserData.APP_ID,
      dtsgToken : dtsgInitialData.token,
      lsdToken  : lsdData?.token,
      dtsgInit  : dtsgInitData ? { token: dtsgInitData.token, async_get_token: dtsgInitData.async_get_token } : undefined,
      getCtx     : (key) => ctx[key],
      getOptions : (key) => ctx.globalOptions[key],
      getRegion  : () => ctx?.region,
    };
  };
};
