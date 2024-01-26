import { getEditor } from "../../notes/editor";
import simpleLexicalPost from "../fixtures/simpleLexicalPost";

describe("test notes lexical editor setup", () => {
  test("creates lexical editor", () => {
    const editor = getEditor(simpleLexicalPost);
    expect(editor.getEditorState().isEmpty()).toBe(false);
  });
});
