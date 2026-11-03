import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini SDK with User-Agent header as required
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parsing for JSON payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // In-memory synced items storage
  const syncedItems = new Map<string, any>();

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Google Maps Grounding endpoint using gemini-3.8-flash with googleMaps tool
  app.post('/api/maps/grounding', async (req, res) => {
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude are required' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Identify the verified place, facility name, address, and nearby notable landmarks at coordinates (${latitude}, ${longitude}). Provide a concise site survey verification summary suitable for field inspection documentation.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: {
                latitude: Number(latitude),
                longitude: Number(longitude),
              },
            },
          },
        },
      });

      // Extract Google Maps grounding chunks and links as required
      const groundingChunks = (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[]) || [];
      const mapsLinks: { title: string; uri: string }[] = [];

      for (const chunk of groundingChunks) {
        if (chunk?.maps?.uri) {
          mapsLinks.push({
            title: chunk.maps.title || 'View on Google Maps',
            uri: chunk.maps.uri,
          });
        }
      }

      return res.json({
        success: true,
        summary: response.text || 'Location verified via Google Maps.',
        mapsLinks,
      });
    } catch (err: any) {
      console.warn('[Google Maps Grounding Error]:', err?.message || err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Google Maps grounding lookup failed',
      });
    }
  });

  // Sync upload route
  app.post('/api/sync-upload', (req, res) => {
    const { id, type, metadata, sizeBytes, timestamp } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Missing item id' });
    }

    syncedItems.set(id, {
      id,
      type,
      metadata,
      sizeBytes,
      timestamp,
      uploadedAt: Date.now(),
    });

    console.log(`[Cloud Server] Synced ${type} "${id}" for site "${metadata?.siteId || 'N/A'}" (Total: ${syncedItems.size})`);

    return res.json({
      success: true,
      id,
      syncedAt: Date.now(),
      totalServerItems: syncedItems.size,
    });
  });

  // Query synced items from server
  app.get('/api/synced-items', (req, res) => {
    return res.json({
      items: Array.from(syncedItems.values()),
      total: syncedItems.size,
    });
  });

  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, port: PORT, host: '0.0.0.0' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pro Field Camera server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
