# Typography Configuration

## Google Fonts Import

Add to your HTML `<head>` or CSS:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

Or via CSS `@import`:

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
```

## Font Usage

- **Space Grotesk** — Headings, spot names, modal titles, profile names, stat numbers
- **Inter** — Body text, labels, navigation, form inputs, descriptive text
- **IBM Plex Mono** — Numeric values (visibility meters), monospaced data display

## Application in Components

Components reference fonts inline as needed:

```tsx
// Heading
style={{ fontFamily: 'Space Grotesk, sans-serif' }}

// Body (applied via Tailwind class)
font-[Inter,sans-serif]

// Mono (for numeric data)
style={{ fontFamily: 'IBM Plex Mono, monospace' }}
```

To simplify, configure these as Tailwind font families in your setup so you can use `font-heading`, `font-body`, `font-mono` utility classes instead of inline styles.
