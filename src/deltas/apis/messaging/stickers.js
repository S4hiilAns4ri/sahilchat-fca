"use strict";
// sahilchat-fca — Sticker API
// Author: S4hiilAns4ri (github.com/S4hiilAns4ri)

const utils = require('../../../utils');

function formatPackList(data) {
  const trayPacks  = data?.data?.picker_plugins?.sticker_picker?.sticker_store?.tray_packs;
  const storePacks = data?.data?.viewer?.sticker_store?.available_packs;
  const packData   = storePacks || trayPacks;
  if (!packData?.edges) return { packs: [], page_info: { has_next_page: false } };
  return {
    packs: packData.edges.map(e => e.node ? ({ id: e.node.id, name: e.node.name, thumbnail: e.node.thumbnail_image?.uri }) : null).filter(Boolean),
    page_info : packData.page_info,
    store_id  : data?.data?.viewer?.sticker_store?.id,
  };
}

function formatStickerList(stickers) {
  if (!stickers) return [];
  return stickers.map(e => e.node ? ({
    type         : "sticker",
    stickerID    : e.node.id,
    ID           : e.node.id,
    url          : e.node.image?.uri,
    animatedUrl  : e.node.animated_image?.uri,
    packID       : e.node.pack?.id,
    label        : e.node.label || e.node.accessibility_label,
  }) : null).filter(Boolean);
}

module.exports = function(defaultFuncs, api, ctx) {
  async function gql(form) {
    const res = await defaultFuncs.post("https://www.facebook.com/api/graphql/", ctx.jar, form)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs));
    if (!res)        throw new Error("GraphQL returned no data.");
    if (res.errors)  throw new Error(res.errors[0].message);
    return res;
  }

  return {
    /**
     * Search stickers by keyword.
     * @param {string} query — Search term (e.g. "love", "happy")
     * @returns {Promise<Array>}
     */
    search: async (query) => {
      const res = await gql({
        fb_api_caller_class    : 'RelayModern',
        fb_api_req_friendly_name : 'CometStickerPickerSearchResultsRootQuery',
        variables : JSON.stringify({ scale: 3, search_query: query, sticker_height: 128, sticker_width: 128, stickerInterface: "MESSAGES" }),
        doc_id    : '24004987559125954',
      });
      return formatStickerList(res?.data?.sticker_search?.sticker_results?.edges);
    },

    /**
     * List your sticker packs.
     * @returns {Promise<Array>}
     */
    listPacks: async () => {
      const res = await gql({
        fb_api_caller_class    : 'RelayModern',
        fb_api_req_friendly_name : 'CometStickerPickerCardQuery',
        variables : JSON.stringify({ scale: 3, stickerInterface: "MESSAGES" }),
        doc_id    : '10095807770482952',
      });
      return formatPackList(res).packs;
    },

    /**
     * Get all stickers in a pack by packID.
     * @param {string} packID
     * @returns {Promise<Array>}
     */
    getStickersInPack: async (packID) => {
      const res = await gql({
        fb_api_caller_class    : 'RelayModern',
        fb_api_req_friendly_name : 'CometStickerPickerPackContentRootQuery',
        variables : JSON.stringify({ packID, stickerWidth: 128, stickerHeight: 128, scale: 3 }),
        doc_id    : '23982341384707469',
      });
      return formatStickerList(res?.data?.sticker_pack?.stickers?.edges);
    },

    /**
     * Add a sticker pack to your collection.
     * @param {string} packID
     * @returns {Promise<object>}
     */
    addPack: async (packID) => {
      const res = await gql({
        fb_api_caller_class    : 'RelayModern',
        fb_api_req_friendly_name : 'CometStickersStorePackMutationAddMutation',
        variables : JSON.stringify({ input: { pack_id: packID, actor_id: ctx.userID, client_mutation_id: Math.round(Math.random() * 10).toString() } }),
        doc_id    : '9877489362345320',
      });
      return res.data.sticker_pack_add.sticker_pack;
    },

    /**
     * Get trending AI-generated stickers.
     * @param {number} [limit=10]
     * @returns {Promise<Array>}
     */
    getAiStickers: async ({ limit = 10 } = {}) => {
      const res = await gql({
        fb_api_caller_class    : 'RelayModern',
        fb_api_req_friendly_name : 'CometStickerPickerStickerGeneratedCardQuery',
        variables : JSON.stringify({ limit }),
        doc_id    : '24151467751156443',
      });
      const nodes = res?.data?.xfb_trending_generated_ai_stickers?.nodes || [];
      return nodes.map(n => ({ type: "sticker", stickerID: n.id, ID: n.id, url: n.url, label: n.label }));
    },
  };
};
