const http = require('http');
const https = require('https');
const url = require('url');

const PORT = parseInt(process.env.TILE_PROXY_PORT || '8888', 10);
const TILE_SOURCE = 'https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png';
const MAX_ZOOM = 22;

function getProxyConfig() {
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  if (!proxyUrl) return null;
  try {
    const parsed = new URL(proxyUrl);
    return { hostname: parsed.hostname, port: parseInt(parsed.port || '8080', 10) };
  } catch {
    return null;
  }
}

const proxyConfig = getProxyConfig();

function fetchTile(tileUrl, res) {
  const parsed = new URL(tileUrl);

  if (proxyConfig) {
    const options = {
      hostname: proxyConfig.hostname,
      port: proxyConfig.port,
      path: tileUrl,
      method: 'GET',
      headers: {
        'Host': parsed.hostname,
        'User-Agent': 'AlertIO-TileProxy/1.0',
        'Accept': 'image/png,image/*',
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      if (proxyRes.statusCode === 200) {
        res.writeHead(200, {
          'Content-Type': proxyRes.headers['content-type'] || 'image/png',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        });
        proxyRes.pipe(res);
      } else {
        res.writeHead(proxyRes.statusCode || 502);
        res.end();
      }
    });

    proxyReq.on('error', () => fetchDirect(tileUrl, res));
    proxyReq.end();
  } else {
    fetchDirect(tileUrl, res);
  }
}

function fetchDirect(tileUrl, res) {
  const direct = https.get(tileUrl, (directRes) => {
    if (directRes.statusCode === 200) {
      res.writeHead(200, {
        'Content-Type': directRes.headers['content-type'] || 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      directRes.pipe(res);
    } else {
      res.writeHead(directRes.statusCode || 502);
      res.end();
    }
  });
  direct.on('error', () => { res.writeHead(502); res.end(); });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname;

  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  const match = path.match(/^\/tiles\/(\d+)\/(\d+)\/(\d+)\.png$/);
  if (!match) {
    res.writeHead(404);
    res.end('Not found. Use /tiles/{z}/{x}/{y}.png');
    return;
  }

  const [, z, x, y] = match;
  if (parseInt(z) > MAX_ZOOM || parseInt(z) < 0) {
    res.writeHead(400);
    res.end('Invalid zoom level');
    return;
  }

  const tileUrl = TILE_SOURCE
    .replace('{z}', z)
    .replace('{x}', x)
    .replace('{y}', y);

  fetchTile(tileUrl, res);
});

const bindHost = process.env.TILE_PROXY_BIND || '127.0.0.1';
server.listen(PORT, bindHost, () => {
  console.log(`Tile proxy running on http://${bindHost}:${PORT}`);
});
