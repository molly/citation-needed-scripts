import { getEditor } from "../editor";
import simpleLexicalPost from "./fixtures/simpleLexicalPost";

describe("test lexical editor setup", () => {
  test("creates lexical editor", () => {
    const editor = getEditor(simpleLexicalPost);
    expect(editor.getEditorState().isEmpty()).toBe(false);
  });
});
