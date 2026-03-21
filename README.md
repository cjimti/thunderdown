# Thunderdown

Lightning-fast Markdown to styled HTML for Thunderbird email composition.

Write your email in Markdown, hit the toggle, and Thunderdown renders it as clean, professional HTML with all styles inlined — ready to send. Gmail, Outlook, Apple Mail, and other clients display it correctly because there are no `<style>` blocks to strip.

## Features

- **GFM Markdown** — headings, lists, tables, task lists, blockquotes, links, images
- **Syntax-highlighted code blocks** — JavaScript, Python, Go, Bash, SQL, JSON, YAML, XML
- **Email-safe output** — all CSS is inlined for maximum client compatibility
- **Toggle on/off** — switch between Markdown source and rendered HTML at any time
- **Keyboard shortcut** — `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`)

## Install

### From .xpi file

1. Download `thunderdown.xpi` from [Releases](https://github.com/cjimti/thunderdown/releases)
2. In Thunderbird, go to **Add-ons Manager** (`Ctrl+Shift+A`)
3. Click the gear icon → **Install Add-on From File…**
4. Select the `.xpi` file

### For development

1. Build the `.xpi` (see [Build](#build))
2. In Thunderbird, go to **Add-ons Manager** (`Ctrl+Shift+A`)
3. Click the gear icon → **Install Add-on From File…**
4. Select the `.xpi` file

## Usage

1. Open a new compose window in Thunderbird
2. Write your email in Markdown
3. Click the **Thunderdown** toolbar button or press `Ctrl+Shift+M`
4. Your Markdown is rendered as styled HTML — send it
5. Click again to toggle back to the Markdown source for editing

## Build

Package the extension into an installable `.xpi`:

```bash
zip -r thunderdown.xpi thunderdown/
```

## Requirements

- Thunderbird 128.0 or later

## License

MIT — see [LICENSE](thunderdown/LICENSE)
