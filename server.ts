import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchKoreanTtsBuffer(text: string, isSlow: boolean): Promise<Buffer | null> {
  const speedParam = isSlow ? '0.24' : '1';
  const urls: Array<{ url: string; headers: Record<string, string> }> = [
    {
      url: `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=ko&client=gtx&ttsspeed=${speedParam}&q=${encodeURIComponent(text)}`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
    {
      url: `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&ttsspeed=${speedParam}&q=${encodeURIComponent(text)}`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        Referer: 'https://translate.google.com/',
      },
    },
    {
      url: `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&le=ko`,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      },
    },
  ];

  for (const candidate of urls) {
    try {
      const response = await fetch(candidate.url, { headers: candidate.headers });
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (buffer.length > 100) {
          return buffer;
        }
      }
    } catch {
      // Try next upstream provider
    }
  }
  return null;
}

// Simple in-memory LRU cache for fast repeated playback
const ttsCache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 300;

async function handleTtsRequest(req: Request, res: Response) {
  try {
    const text = typeof req.query.text === 'string' ? req.query.text.trim() : '';
    if (!text) {
      res.status(400).send('Missing text parameter');
      return;
    }

    const isSlow = req.query.slow === 'true';
    const cacheKey = `${isSlow ? 'slow' : 'norm'}:${text}`;

    let audioBuffer = ttsCache.get(cacheKey) || null;
    if (!audioBuffer) {
      audioBuffer = await fetchKoreanTtsBuffer(text, isSlow);
      if (audioBuffer) {
        if (ttsCache.size >= MAX_CACHE_EntriesLimit()) {
          const firstKey = ttsCache.keys().next().value;
          if (firstKey) ttsCache.delete(firstKey);
        }
        ttsCache.set(cacheKey, audioBuffer);
      }
    }

    if (!audioBuffer) {
      res.status(502).send('TTS upstream unavailable');
      return;
    }

    const totalLength = audioBuffer.length;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Accept-Ranges', 'bytes');

    // Support iOS Safari / QuickTime byte-range requests (Range: bytes=0-1, etc.)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;

      if (!isNaN(start) && !isNaN(end) && start >= 0 && end < totalLength && start <= end) {
        const chunkLength = end - start + 1;
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
        res.setHeader('Content-Length', String(chunkLength));
        res.end(audioBuffer.subarray(start, end + 1));
        return;
      }
    }

    res.status(200);
    res.setHeader('Content-Length', String(totalLength));
    res.end(audioBuffer);
  } catch (err) {
    console.error('TTS proxy error:', err);
    res.status(500).send('Internal TTS error');
  }
}

function MAX_CACHE_EntriesLimit() {
  return MAX_CACHE_ENTRIES;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Korean TTS endpoint
  app.get('/api/tts', handleTtsRequest);

  const distPath = path.resolve(__dirname, 'dist');
  const isProd = process.env.NODE_ENV === 'production' || (fs.existsSync(distPath) && process.env.VITE_DEV !== 'true' && process.argv.includes('--prod'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
