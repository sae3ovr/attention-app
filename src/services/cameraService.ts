import type { PublicCamera } from '../types';

const STREAMS_GEOJSON_URL =
  'https://raw.githubusercontent.com/willytop8/Live-Environment-Streams/main/streams.geojson';

const IOWA_MESONET_URL =
  'https://mesonet.agron.iastate.edu/geojson/webcam.py?network=ISUSM';

function fetchWithTimeout(url: string, timeoutMs = 20000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
}

function classifyEnvironment(env?: string): PublicCamera['type'] {
  if (!env) return 'other';
  const e = env.toLowerCase();
  if (e.includes('traffic') || e.includes('road') || e.includes('highway')) return 'traffic';
  if (e.includes('urban') || e.includes('city')) return 'urban';
  if (e.includes('coast') || e.includes('beach') || e.includes('marina')) return 'coastal';
  if (e.includes('mountain') || e.includes('nature') || e.includes('lake') || e.includes('waterway')) return 'nature';
  return 'other';
}

function classifyQuality(tier?: string): PublicCamera['quality'] {
  if (!tier) return 'standard';
  const t = tier.toLowerCase();
  if (t === 'premium' || t === 'high') return 'high';
  if (t === 'low') return 'low';
  return 'standard';
}

export async function fetchLiveEnvironmentStreams(): Promise<PublicCamera[]> {
  try {
    const res = await fetchWithTimeout(STREAMS_GEOJSON_URL, 30000);
    if (!res.ok) return [];
    const geojson = await res.json();
    if (!geojson.features) return [];

    return (geojson.features as any[])
      .filter((f: any) =>
        f.geometry?.type === 'Point' &&
        f.geometry.coordinates?.length === 2 &&
        f.properties?.url
      )
      .map((f: any, i: number) => ({
        id: `les-${i}`,
        name: f.properties.display_name || f.properties.name || `Camera ${i + 1}`,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        streamUrl: f.properties.url,
        type: classifyEnvironment(f.properties.environment),
        country: f.properties.country_code || 'Unknown',
        quality: classifyQuality(f.properties.quality_tier),
        source: f.properties.source_family || 'unknown',
        scene: f.properties.scene_type || '',
      }));
  } catch {
    return [];
  }
}

export async function fetchIowaMesonetCameras(): Promise<PublicCamera[]> {
  try {
    const res = await fetchWithTimeout(IOWA_MESONET_URL, 10000);
    if (!res.ok) return [];
    const geojson = await res.json();
    if (!geojson.features) return [];

    return (geojson.features as any[])
      .filter((f: any) => f.geometry?.coordinates?.length === 2 && f.properties?.url)
      .map((f: any, i: number) => ({
        id: `iowa-${i}`,
        name: f.properties.name || f.properties.station || `Iowa Cam ${i + 1}`,
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        streamUrl: f.properties.url || f.properties.imgurl || '',
        type: 'nature' as const,
        country: 'US',
        quality: 'standard' as const,
        source: 'iowa_mesonet',
        scene: 'weather',
      }));
  } catch {
    return [];
  }
}

export async function fetchAllCameras(): Promise<PublicCamera[]> {
  const results = await Promise.allSettled([
    fetchLiveEnvironmentStreams(),
    fetchIowaMesonetCameras(),
  ]);

  let all: PublicCamera[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') all = all.concat(r.value);
  }
  return all;
}

export function filterCamerasByBounds(
  cameras: PublicCamera[],
  bounds: { north: number; south: number; east: number; west: number }
): PublicCamera[] {
  return cameras.filter(
    (c) =>
      c.lat >= bounds.south &&
      c.lat <= bounds.north &&
      c.lng >= bounds.west &&
      c.lng <= bounds.east
  );
}

export function filterCamerasByRadius(
  cameras: PublicCamera[],
  centerLat: number,
  centerLng: number,
  radiusKm: number
): PublicCamera[] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  return cameras.filter((c) => {
    const R = 6371;
    const dLat = toRad(c.lat - centerLat);
    const dLng = toRad(c.lng - centerLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(centerLat)) * Math.cos(toRad(c.lat)) * Math.sin(dLng / 2) ** 2;
    const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return d <= radiusKm;
  });
}
