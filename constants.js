export const LETTERS = "abcdefghijklmnopqrstuvwxyz";

export const NOTE_ANCHOR_REGEX = new RegExp(/\[#(?<noteType>fn|ref)-(?<noteId>.*?)\]/, "g");
export const NOTE_ID_REGEX = new RegExp(/\[(?<noteType>fn|ref)-(?<noteId>.*?)\] */);
export const NOTE_CONTENT_REGEX = new RegExp(
  /\[?(?<noteType>fn|ref)-(?<noteId>.*?)\](?<noteContent>.*?)(?=(?:\[?(?:fn|ref)|$))/,
  "msg"
);
