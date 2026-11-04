import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf) {
  let c;
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const typeAndData = Buffer.concat([typeBuf, data]);
  const crcVal = crc32(typeAndData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crcVal, 0);
  return Buffer.concat([len, typeAndData, crcBuf]);
}

function createPng(width, height, pixelShader) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelShader(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Pro Field Camera icon generator
function cameraShader(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.53;
  const dx = nx - cx;
  const dy = ny - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Base background: Pure Black #000000
  let r = 0, g = 0, b = 0, a = 255;

  // Rounded squircle container
  const cornerR = 0.18;
  const inBoxX = Math.abs(nx - 0.5) < (0.45 - cornerR);
  const inBoxY = Math.abs(ny - 0.5) < (0.45 - cornerR);
  const cdx = Math.max(0, Math.abs(nx - 0.5) - (0.45 - cornerR));
  const cdy = Math.max(0, Math.abs(ny - 0.5) - (0.45 - cornerR));
  const inCorner = Math.sqrt(cdx * cdx + cdy * cdy) <= cornerR;

  if (inBoxX || inBoxY || inCorner) {
    // Camera body slate dark
    r = 20; g = 24; b = 33;
  }

  // Camera top pentaprism bump
  if (nx >= 0.38 && nx <= 0.62 && ny >= 0.12 && ny <= 0.22) {
    r = 32; g = 38; b = 52;
  }

  // Red recording LED
  const rledX = nx - 0.76;
  const rledY = ny - 0.32;
  if (Math.sqrt(rledX * rledX + rledY * rledY) < 0.024) {
    return [239, 68, 68, 255];
  }

  // Outer Gold Lens Ring
  if (dist >= 0.24 && dist <= 0.27) {
    return [255, 214, 0, 255]; // High-vis Safety Yellow #FFD600
  }

  // Lens Rim
  if (dist > 0.21 && dist < 0.24) {
    return [15, 23, 42, 255];
  }

  // Lens Glass
  if (dist <= 0.21) {
    // Gradient dark navy glass
    const glassShade = Math.floor(18 + (1 - dist / 0.21) * 22);
    r = glassShade;
    g = glassShade + 6;
    b = glassShade + 18;

    // Crosshair Reticle (circle)
    if (Math.abs(dist - 0.125) < 0.007) {
      return [255, 214, 0, 255];
    }

    // Crosshair Center Target
    if (dist < 0.035) {
      return dist < 0.012 ? [255, 255, 255, 255] : [255, 214, 0, 255];
    }

    // Reticle Cross lines
    if ((Math.abs(dx) < 0.005 && dist >= 0.08 && dist <= 0.18) ||
        (Math.abs(dy) < 0.005 && dist >= 0.08 && dist <= 0.18)) {
      return [255, 214, 0, 255];
    }
  }

  return [r, g, b, a];
}

const outDir = path.resolve('public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPng(192, 192, cameraShader));
console.log('Created public/icon-192.png');

fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPng(512, 512, cameraShader));
console.log('Created public/icon-512.png');

fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPng(180, 180, cameraShader));
console.log('Created public/apple-touch-icon.png');
