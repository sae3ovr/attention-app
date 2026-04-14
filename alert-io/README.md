# Alert.io — Landing Page

Marketing landing page for the Alert.io community safety platform. Static HTML with embedded CSS and vanilla JavaScript.

## Features

- Animated hero with typed headline effect
- Interactive MapLibre GL demo with live incident simulation
- Live incident feed with auto-cycling entries
- Pricing section (Free vs Premium)
- Login/register forms with redirect to main app
- Language selector (PT / EN / ES)
- Particle canvas + cursor glow effects
- Fully responsive (mobile hamburger menu)

## Run Locally

```bash
# Using any static server
npx serve -s -l 8080 .

# Or simply open index.html in a browser
```

## Configuration

The app URL is configurable via `window.ALERT_APP_URL`:

```html
<!-- Set before the closing </body> tag -->
<script>window.ALERT_APP_URL = 'https://app.alert.io';</script>
```

Default: `/app` (relative path for same-domain deployment).

## SEO

- Meta description in Portuguese
- Open Graph tags (og:title, og:description, og:type, og:url)
- Twitter Card metadata
- Canonical URL

## Files

```
alert-io/
├── index.html    # Complete landing page (~1400 lines)
└── logo.svg      # Alert.io wordmark logo
```

## Dependencies

- **MapLibre GL JS 4.7.1** (loaded from unpkg CDN)
- No npm packages — zero-dependency static site

## License

MIT
