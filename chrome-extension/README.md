# Prompt Upgrader — Chrome Extension

Capture Q&A pairs from any webpage directly into your Prompt Upgrader memory.

## How it works

1. **Popup form** — Click the extension icon to open a form pre-filled with the current tab's URL. Fill in the question, answer, and optional tags, then click **Save to Memory**.

2. **Right-click capture** — Select any text on a page, right-click, and choose **Save selection to Prompt Upgrader**. The popup opens with the selected text pre-filled as the question. Add your answer and save.

3. **Settings** — Click the settings link in the popup (or go to Extension Options) to change the server URL if you're running Prompt Upgrader on a port other than 3000.

## Installation (developer mode)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select this `chrome-extension/` folder

## Icons

Add your own PNG icons at these paths before loading the extension:

- `icons/icon16.png` — 16×16 px
- `icons/icon48.png` — 48×48 px
- `icons/icon128.png` — 128×128 px

You can generate them from any image using a tool like [favicon.io](https://favicon.io) or ImageMagick:

```bash
convert icon.png -resize 16x16  icons/icon16.png
convert icon.png -resize 48x48  icons/icon48.png
convert icon.png -resize 128x128 icons/icon128.png
```

## Server configuration

By default the extension posts to `http://localhost:3000`. Change this in **Settings** (options page) if needed. The setting persists across browser sessions via `chrome.storage.local`.

## API contract

The extension calls `POST /api/qa` with:

```json
{
  "source": "https://example.com/article",
  "question": "What is the key insight?",
  "answer": "The insight is...",
  "tags": ["prompting", "rag"]
}
```

This is the same endpoint used by the Prompt Upgrader web UI — no backend changes required.
