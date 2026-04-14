# Alert.io — Tile Proxy

Lightweight Node.js HTTP proxy for map tiles. Used in development environments where direct access to tile CDNs is restricted (e.g., corporate networks).

## Usage

```bash
node server.js
```

Serves tiles at `http://localhost:8888/tiles/{z}/{x}/{y}.png`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TILE_PROXY_PORT` | `8888` | Server port |
| `TILE_PROXY_BIND` | `127.0.0.1` | Bind address |
| `HTTPS_PROXY` | *(none)* | Corporate HTTPS proxy URL (e.g., `http://proxy:8080`) |
| `HTTP_PROXY` | *(none)* | Corporate HTTP proxy URL |

## How It Works

1. Client requests `/tiles/{z}/{x}/{y}.png`
2. Proxy validates zoom level (0–22)
3. If `HTTPS_PROXY` is set, routes through corporate proxy
4. On proxy failure, falls back to direct HTTPS fetch
5. Returns tile with CORS headers + 24h cache

## No Dependencies

Uses only Node.js built-in modules (`http`, `https`, `url`). No npm install needed.

## License

MIT
