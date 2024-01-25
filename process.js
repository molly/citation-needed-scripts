import lexical from "lexical";
const { $getRoot, $getNodeByKey } = lexical;

import { $createHtmlNode } from "@tryghost/kg-default-nodes";

import { getNotesHtml, cleanNoteHtml, getParagraphHtml, replaceTextAnchorsWithHtml } from "./html.js";

import footnotesSectionTemplate from "./templates/footnotesSection.js";

export const NOTE_ANCHOR_REGEX = new RegExp(/\[#(?<noteType>fn|ref)-(?<noteId>.*?)\]/, "g");
const NOTE_CONTENT_REGEX = new RegExp(
  /\[?(?<noteType>fn|ref)-(?<noteId>.*?)\](?<noteContent>.*?)(?=(?:\[?(?:fn|ref)|$))/,
  "msg"
);

export async function processPost(editor) {
  const footnoteMap = new Map();
  const referenceMap = new Map();
  const locationsMap = new Map();

  const editorState = editor.getEditorState();

  editorState.read(() => {
    const root = $getRoot();
    const children = root.getChildren();

    /*
      Find all note anchors in-text and mark their locations, track their IDs
      Map format:
      {
        noteContent: "Footnote here",
        index: 2              <-- index of the note as it appears by anchor
      }
    */
    let footnoteIndex = 1;
    let referenceIndex = 1;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const childText = child.getTextContent();
      const matches = childText.matchAll(NOTE_ANCHOR_REGEX);
      for (let match of matches) {
        const { noteType, noteId } = match.groups;
        const map = noteType === "fn" ? footnoteMap : referenceMap;
        let ind;
        if (!map.has(noteId)) {
          ind = noteType === "fn" ? footnoteIndex : referenceIndex;
          map.set(noteId, { locations: [i], noteContent: null, index: ind });
          if (noteType === "fn") {
            footnoteIndex += 1;
          } else {
            referenceIndex += 1;
          }
        } else {
          map.get(noteId).locations.push(i);
        }
        if (!locationsMap.has(i)) {
          locationsMap.set(i, [{ noteType, noteId }]);
        } else {
          locationsMap.get(i).push({ noteType, noteId });
        }
      }

      // Get the actual content of the notes, ensure anchors are 1:1 with note content
      if (childText.trim().startsWith("[fn-") || childText.trim().startsWith("[ref-")) {
        const notes = getNotesHtml(editor, child);
        for (let note of notes) {
          const cleanNote = cleanNoteHtml(note);
          // Stray <br>s etc. mean this can sometimes not be a valid footnote. Footnotes with content but no valid
          // ID will throw.
          if (cleanNote) {
            const { id, noteType, content } = cleanNote;
            const map = noteType === "fn" ? footnoteMap : referenceMap;
            if (!map.has(id)) {
              throw Error(`Found footnote with ID not referenced in article body: ${id}`);
            }
            map.get(id)["noteContent"] = content;
          }
        }
      }
    }

    // Verify that all notes have content
    footnoteMap.forEach((fn, id) => {
      if (fn.noteContent === null) {
        throw new Error(`No note content was defined for footnote with ID ${id}`);
      }
    });
    referenceMap.forEach((ref, id) => {
      if (ref.noteContent === null) {
        throw new Error(`No note content was defined for reference with ID ${id}`);
      }
    });
  });

  await editor.update(() => {
    const root = $getRoot();
    const children = root.getChildren();

    // Substitute all paragraphs with notes with HTML versions, swapping out the anchors with the final HTML versions
    for (let ind of locationsMap.keys()) {
      const notes = locationsMap.get(ind);
      const paragraphHtml = getParagraphHtml(editor, children[ind], children[ind + 1]);
      const result = replaceTextAnchorsWithHtml(paragraphHtml, notes, footnoteMap, referenceMap);

      const node = $getNodeByKey(children[ind].getKey());
      const htmlNode = $createHtmlNode({ html: result });
      node.replace(htmlNode);
    }
  });

  return editor.getEditorState();
}
