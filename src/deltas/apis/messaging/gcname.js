"use strict";
// sahilchat-fca — gcname (Change Group Name)
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)

const utils = require('../../../utils');

module.exports = function (defaultFuncs, api, ctx) {
  /**
   * Change the name of a group chat.
   *
   * @param {string}   newName     — New group name
   * @param {string}   threadID    — Group thread ID (15 or 16 digit)
   * @param {Function} [callback]  — Optional callback(err, result)
   * @param {string}   [initiatorID] — Optional: ID of who changed the name
   * @returns {Promise<object>}
   *
   * @example
   * await api.gcname("My Group", "1234567890123456");
   */
  return function gcname(newName, threadID, callback, initiatorID) {
    let _callback, _initiatorID;
    let _resolve, _reject;
    const returnPromise = new Promise((resolve, reject) => { _resolve = resolve; _reject = reject; });

    if (utils.getType(callback) === "Function" || utils.getType(callback) === "AsyncFunction") {
      _callback    = callback;
      _initiatorID = initiatorID;
    } else if (typeof callback === "string") {
      _initiatorID = callback;
      _callback    = undefined;
    } else {
      _callback    = undefined;
      _initiatorID = undefined;
    }

    if (!_callback) {
      _callback = (err, data) => err ? _reject(err) : _resolve(data);
    } else {
      const orig = _callback;
      _callback  = (err, data) => { orig(err, data); err ? _reject(err) : _resolve(data); };
    }

    _initiatorID = _initiatorID || ctx.userID;
    threadID     = threadID     || ctx.threadID;

    if (!threadID)             return _callback(new Error("threadID is required to change the group name."));
    if (typeof newName !== 'string') return _callback(new Error("newName must be a string."));
    if (!ctx.mqttClient)       return _callback(new Error("Not connected to MQTT. Call listenMqtt first."));

    ctx.wsReqNumber  += 1;
    ctx.wsTaskNumber += 1;

    const query = {
      failure_count : null,
      label         : '32',
      payload       : JSON.stringify({ thread_key: threadID.toString(), thread_name: newName, sync_group: 1 }),
      queue_name    : threadID.toString(),
      task_id       : ctx.wsTaskNumber,
    };

    const context = {
      app_id     : ctx.appID,
      payload    : JSON.stringify({ epoch_id: parseInt(utils.generateOfflineThreadingID()), tasks: [query], version_id: '24631415369801570' }),
      request_id : ctx.wsReqNumber,
      type       : 3,
    };

    ctx.mqttClient.publish('/ls_req', JSON.stringify(context), { qos: 1, retain: false }, (err) => {
      if (err) return _callback(new Error("MQTT publish failed: " + (err.message || err)));
      _callback(null, { type: "thread_name_update", threadID, newName, senderID: _initiatorID, timestamp: Date.now() });
    });

    return returnPromise;
  };
};
