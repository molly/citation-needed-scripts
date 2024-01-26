import * as cheerio from "cheerio";
import { cleanNoteHtml, removeExtraneousHtml } from "../../notes/html";

describe("test notes html functions", () => {
  describe("test removeExtraneousHtml", () => {
    test("removes unneeded styles while retaining important HTML elements", () => {
      const $ = cheerio.load(
        `<p>This is a post with <em style="white-space: pre-wrap;">emphasis</em></p>`,
        null,
        false
      );
      removeExtraneousHtml($);
      const html = $.html();
      expect(html).toBe(`<p>This is a post with <em>emphasis</em></p>`);
    });

    test("doesn't remove unexpected styles", () => {
      const $ = cheerio.load(
        `<p>This is a post with <em style="white-space: pre-wrap; color: red;">emphasis</em></p>`,
        null,
        false
      );
      removeExtraneousHtml($);
      const html = $.html();
      expect(html).toBe(`<p>This is a post with <em style="color: red;">emphasis</em></p>`);
    });

    test("removes unneeded spans", () => {
      const $ = cheerio.load(
        `<p><span style="white-space: pre-wrap;">This is a post with an unnecessary span element</span></p>`,
        null,
        false
      );
      removeExtraneousHtml($);
      const html = $.html();
      expect(html).toBe(`<p>This is a post with an unnecessary span element</p>`);
    });

    test("doesn't remove spans with useful styles", () => {
      const $ = cheerio.load(
        `<p><span style="white-space: pre-wrap; color: red;">This is a post with a necessary span element</span></p>`,
        null,
        false
      );
      removeExtraneousHtml($);
      const html = $.html();
      expect(html).toBe(`<p><span style="color: red;">This is a post with a necessary span element</span></p>`);
    });

    test("doesn't remove spans with classes", () => {
      const $ = cheerio.load(
        `<p><span class="foo">This is a post with a necessary span element</span></p>`,
        null,
        false
      );
      removeExtraneousHtml($);
      const html = $.html();
      expect(html).toBe(`<p><span class="foo">This is a post with a necessary span element</span></p>`);
    });
  });

  describe("test cleanNoteHtml", () => {
    test("handles empty notes", () => {
      const cleaned = cleanNoteHtml("<br/>");
      expect(cleaned).toBe(null);
    });

    test("throws if there's not a note ID in the note markup", () => {
      expect(() => cleanNoteHtml("<span>no ID here</span>")).toThrow(/Can't find note ID in content/);
    });

    test("extracts note ID", () => {
      const { id: fnId } = cleanNoteHtml("[fn-foo]: bar");
      expect(fnId).toBe("foo");

      const { id: refId } = cleanNoteHtml("[ref-foo]: bar");
      expect(refId).toBe("foo");
    });

    test("wraps footnote in <p>", () => {
      const { content } = cleanNoteHtml("[fn-foo]: bar");
      expect(content).toBe("<p>bar</p>");
    });

    test("removes trailing linebreaks not contained within other HTML", () => {
      const { content } = cleanNoteHtml("<span>[fn-foo]: bar<br></span><br>");
      expect(content).toBe("<p>bar<br></p>");
    });
  });
});
