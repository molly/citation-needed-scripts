import { GHOST_ADMIN_KEY } from "./secrets.js";
import GhostAdminAPI from "@tryghost/admin-api";

import { JSDOM } from "jsdom";

import { getEditor } from "./editor.js";
import { processPost } from "./process.js";

const api = new GhostAdminAPI({
  url: "https://citationneeded.news",
  key: GHOST_ADMIN_KEY,
  version: "v5.75",
});

if (process.argv.length < 3) {
  console.error("Post slug required.");
  process.exit(1);
}
const slug = process.argv[2];

const posts = await api.posts.browse({ filter: `slug:${slug}`, limit: 1 });
if (!posts.length) {
  console.error(`No post with the slug: ${slug}`);
  process.exit(1);
}

const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.DocumentFragment = dom.window.DocumentFragment;

const post = posts[0];
const postId = post.id;
const lexicalState = post.lexical;

// api.posts.add(Object.assign({}, post, { title: "Cite test", slug: "cite-test-dirty" }));

const editor = getEditor(lexicalState);
const edited = await processPost(editor);

const lexicalJson = JSON.stringify(edited);
api.posts.edit({ id: postId, lexical: lexicalJson, updated_at: post.updated_at });
