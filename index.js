import { GHOST_ADMIN_KEY } from "./secrets.js";
import GhostAdminAPI from "@tryghost/admin-api";

import headless from "@lexical/headless";
import lexicalLink from "@lexical/link";
import lexicalList from "@lexical/list";
import lexicalRichText from "@lexical/rich-text";

import { DEFAULT_NODES } from "@tryghost/kg-default-nodes";
const { ListItemNode, ListNode } = lexicalList;
const { HeadingNode, QuoteNode } = lexicalRichText;
const { LinkNode } = lexicalLink;

const { createHeadlessEditor } = headless;

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

const nodes = [HeadingNode, ListNode, ListItemNode, QuoteNode, LinkNode, ...DEFAULT_NODES];
const editor = createHeadlessEditor({
  nodes,
});

const editorState = editor.parseEditorState(lexicalState);
editor.setEditorState(editorState);
