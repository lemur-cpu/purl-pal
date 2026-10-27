# Purl Pal

A cozy little row counter for knitting and crochet. Tap once when you finish a row. A sheep hops. Your place stays put.

Open `index.html` in a browser, or visit the GitHub Pages site after it is published.

## What it does

- Counts rows with a giant, thumb-friendly button
- Tracks pattern repeats (`row 3 of 8 · repeat 2`) and cheers when a repeat lands
- Shows progress toward a goal row
- Nudges you on a chosen row — “switch to contrast yarn”
- Keeps several projects, each with its own notes
- Saves everything in this browser. Nothing is sent to a server
- Optional screen wake-lock and haptic taps
- Add to your phone’s home screen from the share menu

Keyboard: `Space` or `+` adds a row. `-` subtracts. `Ctrl/Cmd+Z` undoes.

## Run it locally

```bash
python3 -m http.server 4173
```

Then open http://localhost:4173

## Tests

```bash
node --test tests/*.test.js
```

## License

MIT
