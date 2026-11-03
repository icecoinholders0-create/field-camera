import { LocationPreset } from '../types/camera';

export const LOCATION_PRESETS: LocationPreset[] = [
  {
    name: 'Industrial Solar Facility 4',
    category: 'Energy',
    lat: 34.9242,
    lon: -118.3182,
    altitude: 782,
    address: 'Mojave Desert Renewable Corridor, Kern County, California, USA',
  },
  {
    name: 'Metropolitan Rail Substation',
    category: 'Transit',
    lat: 37.7793,
    lon: -122.4192,
    altitude: 18,
    address: 'Civic Center Plaza, San Francisco, CA 94102, USA',
  },
  {
    name: 'Offshore Wind Control Terminal',
    category: 'Utilities',
    lat: 53.5511,
    lon: 9.9937,
    altitude: 12,
    address: 'Port of Hamburg Terminal 3, Hamburg, Germany',
  },
  {
    name: 'High-Voltage Telecom Tower 109',
    category: 'Telecom',
    lat: 35.6895,
    lon: 139.6917,
    altitude: 45,
    address: 'Shinjuku District Infrastructure Grid, Tokyo, Japan',
  },
  {
    name: 'Civil Engineering Bridge Inspection',
    category: 'Infrastructure',
    lat: 51.5055,
    lon: -0.0754,
    altitude: 24,
    address: 'Tower Bridge Approach Road, London SE1 2UP, UK',
  },
];

export function formatCoordinates(lat: number | null, lon: number | null): string {
  if (lat === null || lon === null) return 'GPS Fix Acquiring...';
  const latStr = `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

export function formatHeading(heading: number | null): { degStr: string; cardinal: string; full: string } {
  if (heading === null || isNaN(heading)) {
    return { degStr: '---°', cardinal: 'N', full: 'Heading: Acquiring...' };
  }
  const norm = ((heading % 360) + 360) % 360;
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(norm / 45) % 8;
  const cardinal = directions[index];
  const degStr = `${Math.round(norm).toString().padStart(3, '0')}°`;
  return {
    degStr,
    cardinal,
    full: `Heading: ${degStr} ${cardinal}`,
  };
}

export function formatFieldDateTime(date: Date = new Date()): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const formattedHours = String(hours).padStart(2, '0');

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offH = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const offM = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  const gmtString = `GMT${sign}${offH}:${offM}`;

  return `${day}/${month}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm} ${gmtString}`;
}

// In-memory geocode cache
const addressCache = new Map<string, string>();

export async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
  if (addressCache.has(key)) {
    return addressCache.get(key)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'en',
        },
      }
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Geocoding response not ok');
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const road = a.road || a.pedestrian || a.street || '';
      const neighborhood = a.neighbourhood || a.suburb || a.city_district || '';
      const city = a.city || a.town || a.village || a.county || '';
      const state = a.state || a.province || '';
      const country = a.country || '';
      const postcode = a.postcode || '';

      const parts = [
        road,
        neighborhood,
        city,
        state ? `${state} ${postcode}`.trim() : '',
        country,
      ].filter(Boolean);

      const addressStr = parts.slice(0, 4).join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || 'Site Location Verified';
      addressCache.set(key, addressStr);
      return addressStr;
    }
  } catch (err) {
    console.warn('Reverse geocode failed or timed out:', err);
  }

  const fallback = `Coordinates Fix: ${lat >= 0 ? lat.toFixed(4) : (-lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'}, ${lon >= 0 ? lon.toFixed(4) : (-lon).toFixed(4)}°${lon >= 0 ? 'E' : 'W'}`;
  return fallback;
}

// Tile image loader for mini-map
const mapTileCache = new Map<string, HTMLImageElement>();

export async function getMapTileImage(lat: number, lon: number, zoom = 15): Promise<HTMLCanvasElement> {
  const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );

  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Background grid fallback
  ctx.fillStyle = '#1c1f26';
  ctx.fillRect(0, 0, 160, 160);
  ctx.strokeStyle = '#2d3340';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 20; i < 160; i += 20) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 160);
    ctx.moveTo(0, i);
    ctx.lineTo(160, i);
  }
  ctx.stroke();

  return new Promise((resolve) => {
    let img = mapTileCache.get(tileUrl);
    if (!img) {
      img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = tileUrl;
      mapTileCache.set(tileUrl, img);
    }

    const drawPin = () => {
      // Draw crosshair reticle and pin
      const cx = 80;
      const cy = 80;

      // Glow circle
      ctx.fillStyle = 'rgba(255, 42, 42, 0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();

      // Center dot
      ctx.fillStyle = '#ff2a2a';
      ctx.beginPath();
      ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
      ctx.fill();

      // Border ring
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Crosshair lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx - 6, cy);
      ctx.moveTo(cx + 6, cy);
      ctx.lineTo(cx + 10, cy);
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx, cy - 6);
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx, cy + 10);
      ctx.stroke();

      resolve(canvas);
    };

    if (img.complete && img.naturalWidth !== 0) {
      ctx.drawImage(img, 0, 0, 160, 160);
      drawPin();
    } else {
      img.onload = () => {
        ctx.drawImage(img!, 0, 0, 160, 160);
        drawPin();
      };
      img.onerror = () => {
        // Fallback drawing with coordinate label
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('MAP GRID', 80, 50);
        ctx.fillText(`${lat.toFixed(2)}°, ${lon.toFixed(2)}°`, 80, 120);
        drawPin();
      };
    }
  });
}
