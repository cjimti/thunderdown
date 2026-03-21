# Thunderdown

A Thunderbird extension that turns Markdown into email-ready HTML. Write in Markdown, click the button, and the compose body becomes styled HTML with all CSS inlined. No `<style>` blocks means Gmail, Outlook, and Apple Mail won't strip your formatting.

## What it does

- GFM Markdown: headings, lists, tables, task lists, blockquotes, links, images
- Syntax-highlighted code blocks (JavaScript, Python, Go, Bash, SQL, JSON, YAML, XML)
- All CSS inlined so email clients can't strip it
- Toggle between Markdown source and rendered HTML
- Keyboard shortcut: `Ctrl+Shift+M` (Mac: `Cmd+Shift+M`)

## Install

Download `thunderdown.xpi` from [Releases](https://github.com/cjimti/thunderdown/releases), then in Thunderbird: Add-ons Manager (`Ctrl+Shift+A`) > gear icon > Install Add-on From File.

## Usage

1. Open a compose window in Thunderbird
2. Write your email in Markdown
3. Click the Thunderdown toolbar button or press `Ctrl+Shift+M`
4. The Markdown is replaced with styled HTML, ready to send
5. Click again to get back to the raw Markdown if you need to edit

## Build

```bash
cd thunderdown && zip -r ../thunderdown.xpi . -x '*.DS_Store'
```

## Requirements

Thunderbird 128.0+

## License

MIT. See [LICENSE](thunderdown/LICENSE).
