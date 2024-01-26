# Footnotes and references

Run the script with `npm run notes`, passing along the slug of the post as the first argument.

The script will automatically make a copy of your post at `${slug}-backup`. You can disable this with the `--no-backup` flag.

You will need to save a `secrets.js` file with a Ghost API key to handle the fetching and updating of the post:

```
export const GHOST_ADMIN_KEY = "ghost_key_goes_here";
```

Use at your own risk — this script hasn't been meticulously tested with all Ghost markup. I would recommend running it at the very end of your writing, because it will turn any content sections containing notes into HTML sections, which then require you to write HTML to do any formatting.

## Post format

The script will look for in-text footnote and reference anchors in the format `[#fn-id]` or `[#ref-id]`.

The contents of those footnotes and references should be defined in paragraphs at the bottom of the post with the following format:

```
[fn-id1] First footnote content.
[fn-id2] Second footnote content. This can be rich text, by the way.

[ref-id1] First reference
[ref-id2] Second reference
[ref-id3] And so on...
```

These do not necessarily have to be in the proper order — this script will rearrange the footnotes to appear in the order they're used in the post. However, every anchor needs to have a corresponding note defined, and vice versa.

There can only be one footnote/reference defined with the same ID, although that note can be used repeatedly throughout the post text by repeating the `[#fn-id]` or `[#ref-id]` anchor syntax as much as you want.

References/footnotes can use note anchors within their content, for example:

```
[fn-id1] This is a note that cites another source.[#ref-id1] More note content...
```

A longer example of the markup used in the Ghost editor is at [example-markup.txt](docs/example-markup.txt), and the output is at [example-output.txt](docs/example-output.txt). This is a (slightly simplified) portion of an [actual live post](https://citationneeded.news/issue-49/).
