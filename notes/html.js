import * as cheerio from "cheerio";
import lexical from "lexical";
import lexicalHtml from "@lexical/html";

const { $createNodeSelection } = lexical;
const { $generateHtmlFromNodes } = lexicalHtml;
import { LETTERS, NOTE_ID_REGEX } from "./constants.js";

export function removeExtraneousHtml($) {
  // Remove extraneous styles
  $("*[style]").each(function () {
    const $this = $(this);
    if ($this.attr("style") === "white-space: pre-wrap;") {
      $this.removeAttr("style");
    } else {
      const style = $this.attr("style").replace("white-space: pre-wrap;", "").trim();
      $this.attr("style", style);
    }
  });

  // Remove spans not used for additional styling
  $("span")
    .filter(function () {
      return !$(this).attr("style") && !$(this).attr("class");
    })
    .replaceWith(function () {
      return $(this).html();
    });
}

export function cleanNoteHtml(note) {
  // Store note ID and remove ID from string
  const noteMatch = note.match(NOTE_ID_REGEX);
  if (!noteMatch) {
    const $ = cheerio.load(`<p>${note}</p>`, null, false);
    if ($("p").text().trim() === "") {
      // Stray whitespace or something, return and move on to an actual note
      return null;
    }
    throw new Error(`Can't find note ID in content: ${note}`);
  }
  const { noteId, noteType } = noteMatch.groups;
  note = note.replace(NOTE_ID_REGEX, "");

  // Wrap in <p>
  const $ = cheerio.load(`<p>${note}</p>`, null, false);
  const $p = $("p");

  // Remove extraneous styles
  removeExtraneousHtml($);

  // Remove trailing <br>
  const children = $p.children();
  if (children.length && children[children.length - 1].name === "br") {
    $(children[children.length - 1]).remove();
  }

  return { id: noteId, noteType, content: $.html() };
}

export function getNotesHtml(editor, el) {
  // Turn the notes into an array of HTML
  const notes = [];
  const children = el.getChildren();
  editor.update(() => {
    const nodeSelection = $createNodeSelection();
    let lastKey = null;
    for (let i = 0; i < children.length; i++) {
      if (
        (children[i].getTextContent().startsWith("[fn-") || children[i].getTextContent().startsWith("[ref-")) &&
        i > 0
      ) {
        // Convert previous selection to HTML; start a new selection and add this node
        const html = $generateHtmlFromNodes(editor, nodeSelection);
        notes.push(html);
        nodeSelection.clear();
      }
      const nodeKey = children[i].getKey();
      const nodeKeyInt = parseInt(nodeKey, 10);

      // This is janky asf but I can't for the life of me figure out RangeSelections from the docs
      if (lastKey && lastKey < nodeKeyInt - 1) {
        while (lastKey + 1 < nodeKey) {
          nodeSelection.add((lastKey + 1).toString());
          lastKey += 1;
        }
      }

      nodeSelection.add(nodeKey);
      lastKey = nodeKeyInt;
    }
    const html = $generateHtmlFromNodes(editor, nodeSelection);
    notes.push(html);
    nodeSelection.clear();
  });
  return notes;
}

export function getParagraphHtml(editor, paragraph, nextParagraph) {
  const paragraphKey = paragraph.getKey();
  const nextParagraphKey = nextParagraph.getKey();
  const nodeSelection = $createNodeSelection(paragraphKey);

  let paragraphKeyInt = parseInt(paragraphKey, 10);
  const nextParagraphKeyInt = parseInt(nextParagraphKey, 10);
  while (paragraphKeyInt < nextParagraphKeyInt - 1) {
    paragraphKeyInt += 1;
    nodeSelection.add(paragraphKeyInt.toString());
  }
  const html = $generateHtmlFromNodes(editor, nodeSelection);

  // Wrap in <p> and load with cheerio
  const $ = cheerio.load(`<p>${html}</p>`, null, false);

  // Remove extraneous styles
  removeExtraneousHtml($);

  return $.html();
}

export function replaceTextAnchorsWithHtml(html, notes = null, footnoteMap, referenceMap) {
  let newHtml = html.slice();
  if (!notes) {
    notes = [];
    const notesMatch = newHtml.matchAll(/\[#(?<noteType>fn|ref)-(?<noteId>.*?)\]/g);
    for (let match of notesMatch) {
      notes.push(match.groups);
    }
  }
  for (let note of notes) {
    const map = note.noteType === "fn" ? footnoteMap : referenceMap;
    const noteType = note.noteType === "fn" ? "footnote" : "reference";

    const noteIndexNumerical = map.get(note.noteId).index;

    // Get display note identifier (numerical for references, alphabetic for footnotes)
    let noteIndexDisplay = noteIndexNumerical;
    if (note.noteType === "fn") {
      noteIndexDisplay = LETTERS[noteIndexNumerical - 1];
    }

    const noteHtml = `<sup id="${noteType}-anchor-${noteIndexNumerical}" class="${noteType}-anchor"><a href="#${noteType}-${noteIndexNumerical}">${noteIndexDisplay}</a></sup>`;
    const toSwap = `[#${note.noteType}-${note.noteId}]`;

    newHtml = newHtml.replaceAll(toSwap, noteHtml);
  }
  return newHtml;
}

export function createNotesSection(noteMap, template, noteType) {
  let html = template;
  for (let note of noteMap.values()) {
    html += `<li id="${noteType}-${note.index}">${note.noteContent}</li>`;
  }
  html += `</ol>\n</div>`;
  const $ = cheerio.load(html, null, false);
  const $p = $("ol")
    .find("li")
    .each(function () {
      const $this = $(this);
      const id = $this.attr("id");
      const [_, noteIndex] = id.split("-");
      const noteLabel = noteType === "footnote" ? LETTERS[parseInt(noteIndex, 10) - 1] : noteIndex;
      $this
        .children("p")
        .append(
          ` <a href="#${noteType}-anchor-${noteIndex}" title="Jump back to ${noteType} ${noteLabel} in the text.">↩</a>`
        );
    });
  return $.html();
}
