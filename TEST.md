# Thunderdown Test Document

This is a test of the Thunderdown Markdown renderer. Below is a comprehensive set of Markdown features.

## Inline Formatting

This is **bold text** and this is *italic text* and this is ***bold italic***. Here is ~~strikethrough text~~ and here is `inline code` with some text after it.

Inline code with HTML: `<style>`, `<div class="foo">`, `<script>alert('hi')</script>`.

## Headings

### Third Level Heading
#### Fourth Level Heading
##### Fifth Level Heading
###### Sixth Level Heading

## Links and Images

Here is a [link to Google](https://www.google.com) and a [link with title](https://github.com "GitHub Homepage").

## Blockquotes

> This is a blockquote. It can span multiple lines.
>
> It can also have **bold** and *italic* text inside.

> Nested blockquote:
>
> > This is nested inside the outer blockquote.

## Unordered Lists

- First item
- Second item with **bold**
- Third item
  - Nested item one
  - Nested item two
- Fourth item

## Ordered Lists

1. First step
2. Second step
3. Third step
   1. Sub-step one
   2. Sub-step two
4. Fourth step

## Task Lists

- [x] Completed task
- [x] Another completed task
- [ ] Incomplete task
- [ ] Another incomplete task

## Code Blocks

JavaScript:

```javascript
function greet(name) {
  const message = `Hello, ${name}!`;
  console.log(message);
  return message;
}

const result = greet("World");
```

Python:

```python
def fibonacci(n):
    """Generate fibonacci sequence up to n."""
    a, b = 0, 1
    while a < n:
        yield a
        a, b = b, a + b

for num in fibonacci(100):
    print(num)
```

Go:

```go
package main

import "fmt"

func main() {
    ch := make(chan string, 1)
    ch <- "hello"
    msg := <-ch
    fmt.Println(msg)
}
```

Bash:

```bash
#!/bin/bash
for file in *.txt; do
    echo "Processing: $file"
    wc -l "$file"
done
```

JSON:

```json
{
  "name": "thunderdown",
  "version": "1.0.0",
  "tags": ["markdown", "email", "thunderbird"],
  "enabled": true
}
```

YAML:

```yaml
services:
  web:
    image: nginx:latest
    ports:
      - "8080:80"
    environment:
      DEBUG: "true"
```

SQL:

```sql
SELECT u.name, COUNT(o.id) AS order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2025-01-01'
GROUP BY u.name
HAVING COUNT(o.id) > 5
ORDER BY order_count DESC;
```

XML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<config>
  <server host="localhost" port="8080"/>
  <database>
    <connection>postgresql://db:5432/app</connection>
  </database>
</config>
```

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Headings | Done | All 6 levels |
| **Bold** in tables | Done | Works inline |
| Code `snippets` | Done | Inline code |
| Links | Done | [Example](https://example.com) |

Right-aligned and centered columns:

| Left | Center | Right |
|:-----|:------:|------:|
| A1 | B1 | $10.00 |
| A2 | B2 | $20.00 |
| A3 | B3 | $1,500.00 |

## Horizontal Rules

Above the rule.

---

Below the rule.

## HTML Entities and Special Characters

Ampersand: &, Less than: <, Greater than: >, Quotes: "double" and 'single'.

## Paragraphs and Line Breaks

This is the first paragraph. It has multiple sentences to test wrapping and spacing between paragraphs.

This is the second paragraph. It comes after a blank line which should create proper paragraph spacing.
