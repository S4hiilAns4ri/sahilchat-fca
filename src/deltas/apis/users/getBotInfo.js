"use strict";
// sahilchat-fca — getBotInfo
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)
// Returns basic info about the currently logged-in account

const utils = require('../../../utils');

module.exports = (defaultFuncs, api, ctx) => {
  /**
   * Get info about the currently logged-in account.
   * Returns: { id, name, firstName, thumbSrc, profileUrl, vanity }
   *
   * @returns {Promise<object>}
   *
   * @example
   * const info = await api.getBotInfo();
   * console.log("Name:", info.name, "| ID:", info.id);
   */
  return async function getBotInfo() {
    const myID = ctx.userID;

    if (!myID) throw new Error("getBotInfo: userID not found in context.");

    const form = {
      ...ctx.fb_dtsg && { fb_dtsg: ctx.fb_dtsg },
      ...ctx.jazoest  && { jazoest: ctx.jazoest },
      user: myID,
    };

    const res = await defaultFuncs
      .post("https://www.facebook.com/chat/user_info/", ctx.jar, {
        ...form,
        "ids[0]": myID,
      })
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

    const payload = res?.payload?.profiles?.[myID]
                 || res?.payload?.[myID]
                 || null;

    if (!payload) {
      // Fallback: use getUserInfo
      try {
        const userRes = await api.getUserInfo(myID);
        const data = userRes?.[myID];
        if (!data) throw new Error("No data");
        return {
          id         : myID,
          name       : data.name || "",
          firstName  : data.firstName || "",
          thumbSrc   : data.thumbSrc || "",
          profileUrl : data.profileUrl || ("https://www.facebook.com/profile.php?id=" + myID),
          vanity     : data.vanity || "",
        };
      } catch(e) {
        utils.warn("getBotInfo", "Fallback also failed: " + e.message);
        return { id: myID, name: "", firstName: "", thumbSrc: "", profileUrl: "", vanity: "" };
      }
    }

    return {
      id         : myID,
      name       : payload.name         || "",
      firstName  : payload.firstName    || "",
      thumbSrc   : payload.thumbSrc     || payload.imageLink || "",
      profileUrl : payload.profileUrl   || ("https://www.facebook.com/profile.php?id=" + myID),
      vanity     : payload.vanity       || "",
      type       : payload.type         || "",
    };
  };
};
