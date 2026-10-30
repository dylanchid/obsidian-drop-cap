# Drop Cap

Add a stylized drop cap to the first paragraph of a note.

## Use

In **Settings → Drop Cap**, choose automatic mode to style the opening paragraph of each note, or manual mode to style only a letter marked with `{A}` syntax. Use **Wrap character as drop cap** or the editor context menu to insert the marker.

**Toggle drop cap for this note** adds or removes `drop_cap: false` in the note's frontmatter. That property takes effect when **Respect frontmatter** is enabled (it is on by default). With the setting off, the plugin ignores `drop_cap` on every note.

## Install manually

Run `npm ci && npm run build`, then copy `manifest.json`, `main.js`, and `styles.css` into `<vault>/.obsidian/plugins/drop-cap/`. Enable Drop Cap under **Settings → Community plugins**.

## Source

The TypeScript source is in `src/`. Run `npm ci` and `npm run build` to generate `main.js`.

## Existing installations

Earlier local builds used the ID `obsidian-drop-cap`. Before installing this ID, disable the earlier plugin. To retain settings, copy `data.json` from the earlier plugin folder into the new `drop-cap` folder while Obsidian is closed, then reassign any plugin hotkeys. Keep a backup of the original file until the new installation works.

## License

MIT. See [LICENSE](LICENSE).
