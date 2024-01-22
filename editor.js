import headless from "@lexical/headless";
import lexicalLink from "@lexical/link";
import lexicalList from "@lexical/list";
import lexicalRichText from "@lexical/rich-text";

import { DEFAULT_NODES } from "@tryghost/kg-default-nodes";

const { ListItemNode, ListNode } = lexicalList;
const { HeadingNode, QuoteNode } = lexicalRichText;
const { LinkNode } = lexicalLink;

const { createHeadlessEditor } = headless;

const nodes = [HeadingNode, ListNode, ListItemNode, QuoteNode, LinkNode, ...DEFAULT_NODES];

export function getEditor(lexicalState) {
  const editor = createHeadlessEditor({
    nodes,
  });

  const editorState = editor.parseEditorState(lexicalState);
  editor.setEditorState(editorState);
  return editor;
}
