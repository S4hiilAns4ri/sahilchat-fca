"use strict";
// sahilchat-fca — sendMessage
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)
// Supports: Group thread IDs of any length (15, 16, 17, 18, 19... digits)

const utils = require('../../../utils');

const allowedProperties = {
  attachment : true,
  url        : true,
  sticker    : true,
  emoji      : true,
  emojiSize  : true,
  body       : true,
  mentions   : true,
  location   : true,
};

/**
 * Facebook Group Thread ID — Important Notes:
 *
 * Group thread IDs can be ANY length: 15, 16, 17, 18, 19, 100 digits — all valid.
 * Facebook does NOT use a fixed digit count for group IDs.
 *
 * This module ONLY supports group thread IDs (thread_fbid).
 * Facebook DM/Inbox is E2EE (end-to-end encrypted) and no longer supported.
 *
 * All numeric IDs → thread_fbid (group mode) automatically.
 */

module.exports = (defaultFuncs, api, ctx) => {

  async function uploadAttachment(attachments) {
    const uploads = [];
    for (const att of attachments) {
      if (!utils.isReadableStream(att)) {
        throw new Error("Attachment must be a readable stream, got: " + utils.getType(att));
      }
      const res = await defaultFuncs.postFormData(
        "https://upload.facebook.com/ajax/mercury/upload.php",
        ctx.jar,
        { upload_1024: att, voice_clip: "true" },
        {}
      ).then(utils.parseAndCheckLogin(ctx, defaultFuncs));
      if (res.error) throw new Error("Upload failed: " + JSON.stringify(res));
      uploads.push(res.payload.metadata[0]);
    }
    return uploads;
  }

  async function getUrl(url) {
    const res = await defaultFuncs.post(
      "https://www.facebook.com/message_share_attachment/fromURI/",
      ctx.jar,
      { image_height: 960, image_width: 960, uri: url }
    ).then(utils.parseAndCheckLogin(ctx, defaultFuncs));
    if (!res || res.error || !res.payload) throw new Error("URL attachment failed: " + JSON.stringify(res));
    return res.payload;
  }

  async function sendContent(form, threadID, messageAndOTID) {
    const tid = String(threadID);

    if (Array.isArray(threadID)) {
      // Create new group with list of user IDs
      threadID.forEach((id, idx) => { form[`specific_to_list[${idx}]`] = "fbid:" + id; });
      form[`specific_to_list[${threadID.length}]`] = "fbid:" + ctx.userID;
      form["client_thread_id"] = "root:" + messageAndOTID;
      utils.log("sendMessage", "Creating new group with users: " + threadID.join(', '));
    } else {
      // Group thread — works for any digit length (15, 16, 17, 18, 19...)
      form["thread_fbid"] = tid;
      utils.log("sendMessage", "Sending to group thread: " + tid);
    }

    if (ctx.globalOptions.pageID) {
      form["author"]                         = "fbid:" + ctx.globalOptions.pageID;
      form["specific_to_list[1]"]            = "fbid:" + ctx.globalOptions.pageID;
      form["creator_info[creatorID]"]        = ctx.userID;
      form["creator_info[creatorType]"]      = "direct_admin";
      form["creator_info[labelType]"]        = "sent_message";
      form["creator_info[pageID]"]           = ctx.globalOptions.pageID;
      form["request_user_id"]               = ctx.globalOptions.pageID;
      form["creator_info[profileURI]"]       = "https://www.facebook.com/profile.php?id=" + ctx.userID;
    }

    const resData = await defaultFuncs
      .post("https://www.facebook.com/messaging/send/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

    if (!resData) throw new Error("Send message failed — no response.");
    if (resData.error) {
      if (resData.error === 1545012) {
        utils.warn("sendMessage", "Error 1545012: You may not be a member of thread " + tid);
      }
      throw new Error("Send message error: " + JSON.stringify(resData));
    }

    return resData.payload.actions.reduce((p, v) => ({
      threadID  : v.thread_fbid,
      messageID : v.message_id,
      timestamp : v.timestamp,
    }), null);
  }

  /**
   * Send a message to a Facebook group thread.
   *
   * NOTE: Facebook DM/Inbox is end-to-end encrypted (E2EE) and no longer
   * supported by this API. Only group thread IDs work.
   *
   * @param {string|object}        msg           — Text string or message object {body, sticker, attachment, url, emoji, mentions, location}
   * @param {string|number|Array}  threadID      — Group thread ID (any digit length: 15, 16, 17, 18, 19...) or array of user IDs to create new group
   * @param {string}               [replyToMessage] — Message ID to reply to a specific message (optional)
   *
   * @example
   * // Send text to group
   * api.sendMessage("Hello group!", "123456789012345");
   *
   * // Send sticker to group
   * api.sendMessage({ sticker: "369239263222822" }, "123456789012345");
   *
   * // Reply to a specific message in group
   * api.sendMessage("Reply!", groupThreadID, messageID);
   *
   * // Create new group from user IDs (array)
   * api.sendMessage("Hello new group!", ["uid1", "uid2", "uid3"]);
   */
  return async (msg, threadID, replyToMessage) => {
    const msgType = utils.getType(msg);
    if (msgType !== "String" && msgType !== "Object") {
      throw new Error("Message must be a string or object, got: " + msgType);
    }
    if (msgType === "String") msg = { body: msg };

    const disallowed = Object.keys(msg).filter(p => !allowedProperties[p]);
    if (disallowed.length > 0) throw new Error("Disallowed message properties: " + disallowed.join(", "));

    if (replyToMessage && utils.getType(replyToMessage) !== 'String') {
      throw new Error("replyToMessage must be a string message ID.");
    }

    const messageAndOTID = utils.generateOfflineThreadingID();
    const form = {
      client                          : "mercury",
      action_type                     : "ma-type:user-generated-message",
      author                          : "fbid:" + ctx.userID,
      timestamp                       : Date.now(),
      timestamp_absolute              : "Today",
      timestamp_relative              : utils.generateTimestampRelative(),
      timestamp_time_passed           : "0",
      is_unread                       : false,
      is_cleared                      : false,
      is_forward                      : false,
      is_filtered_content             : false,
      is_filtered_content_bh          : false,
      is_filtered_content_account     : false,
      is_filtered_content_quasar      : false,
      is_filtered_content_invalid_app : false,
      is_spoof_warning                : false,
      source                          : "source:chat:web",
      "source_tags[0]"                : "source:chat",
      ...(msg.body && { body: msg.body }),
      html_body                       : false,
      ui_push_phase                   : "V3",
      status                          : "0",
      offline_threading_id            : messageAndOTID,
      message_id                      : messageAndOTID,
      threading_id                    : utils.generateThreadingID(ctx.clientID),
      "ephemeral_ttl_mode:"           : "0",
      manual_retry_cnt                : "0",
      has_attachment                  : !!(msg.attachment || msg.url || msg.sticker),
      signatureID                     : utils.getSignatureID(),
      ...(replyToMessage && { replied_to_message_id: replyToMessage }),
    };

    if (msg.location) {
      if (!msg.location.latitude || !msg.location.longitude) throw new Error("location needs both latitude and longitude.");
      form["location_attachment[coordinates][latitude]"]  = msg.location.latitude;
      form["location_attachment[coordinates][longitude]"] = msg.location.longitude;
      form["location_attachment[is_current_location]"]    = !!msg.location.current;
    }
    if (msg.sticker)  form["sticker_id"] = msg.sticker;
    if (msg.attachment) {
      form.image_ids = []; form.gif_ids = []; form.file_ids = []; form.video_ids = []; form.audio_ids = [];
      if (utils.getType(msg.attachment) !== "Array") msg.attachment = [msg.attachment];
      const files = await uploadAttachment(msg.attachment);
      files.forEach(file => {
        const type = Object.keys(file)[0];
        form[type + "s"].push(file[type]);
      });
    }
    if (msg.url) {
      form["shareable_attachment[share_type]"]   = "100";
      form["shareable_attachment[share_params]"] = await getUrl(msg.url);
    }
    if (msg.emoji) {
      if (!msg.emojiSize) msg.emojiSize = "medium";
      if (!["small","medium","large"].includes(msg.emojiSize)) throw new Error("emojiSize must be small, medium, or large.");
      if (!form.body) throw new Error("body must not be empty when using emoji.");
      form.body = msg.emoji;
      form["tags[0]"] = "hot_emoji_size:" + msg.emojiSize;
    }
    if (msg.mentions) {
      for (let i = 0; i < msg.mentions.length; i++) {
        const { tag, id, fromIndex } = msg.mentions[i];
        if (typeof tag !== "string") throw new Error("Mention tags must be strings.");
        const offset = msg.body.indexOf(tag, fromIndex || 0);
        if (offset < 0) utils.warn("sendMessage", `Mention "${tag}" not found in body.`);
        const emptyChar = '\u200E';
        form["body"]                              = emptyChar + msg.body;
        form[`profile_xmd[${i}][offset]`]        = offset + 1;
        form[`profile_xmd[${i}][length]`]        = tag.length;
        form[`profile_xmd[${i}][id]`]            = id || 0;
        form[`profile_xmd[${i}][type]`]          = "p";
      }
    }

    return sendContent(form, threadID, messageAndOTID);
  };
};
