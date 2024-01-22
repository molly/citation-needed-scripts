import lexical from "lexical";

const { $getRoot } = lexical;

const NOTE_ANCHOR_REGEX = new RegExp(/\[#(?<noteType>fn|ref)-(?<noteId>.*?)\]/, "g");
const NOTE_CONTENT_REGEX = new RegExp(
  /\[#?(?<noteType>fn|ref)-(?<noteId>.*?)\](?<noteContent>.*?)(?=(?:\[#?(?:fn|ref)|$))/,
  "msg"
);

function processNotesContentList(el) {}

export function processPost(editor) {
  const footnoteMap = new Map();
  const referenceMap = new Map();

  const editorState = editor.getEditorState();

  editorState.read(() => {
    const root = $getRoot();
    const children = root.getChildren();
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childText = child.getTextContent();
      const matches = childText.matchAll(NOTE_ANCHOR_REGEX);
      for (let match of matches) {
        const { noteType, noteId } = match.groups;
        const map = noteType === "fn" ? footnoteMap : referenceMap;
        if (!map.has(noteId)) {
          map.set(noteId, { locations: [i], noteContent: null });
        } else {
          map.get(noteId).locations.push(i);
        }
      }

      if (childText.startsWith("[fn-")) {
        processNotesContentList(child);
      }
    }
    console.log(footnoteMap);
    console.log(referenceMap);
  });
}
