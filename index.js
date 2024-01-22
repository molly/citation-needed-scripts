import { GHOST_ADMIN_KEY } from "./secrets.js";
import GhostAdminAPI from "@tryghost/admin-api";

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

const post = posts[0];
const lexicalState = post.lexical;
console.log(lexicalState);

// api.posts.add(Object.assign({}, post, { title: "Cite test", slug: "cite-test" }));

const editor = getEditor(lexicalState);
processPost(editor);
