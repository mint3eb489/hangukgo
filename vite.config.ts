import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

const ttsMemoryCache = new Map<string, Buffer>();

async function fetchUpstreamTts(text: string, isSlow: boolean): Promise<Buffer | null> {
  const speedParam = isSlow ? '0.24' : '1';
  const candidates: Array<{ url: string; headers: Record<string, string> }> = [
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

  for (const c of candidates) {
    try {
      const ttsRes = await fetch(c.url, { headers: c.headers });
      if (ttsRes.ok) {
        const buf = Buffer.from(await ttsRes.arrayBuffer());
        if (buf.length > 100) return buf;
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

function koreanTtsPlugin(): Plugin {
  const ttsMiddleware = async (req: any, res: any) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const text = url.searchParams.get('text')?.trim();
      if (!text) {
        res.statusCode = 400;
        res.end('Missing text parameter');
        return;
      }

      const isSlow = url.searchParams.get('slow') === 'true';
      const cacheKey = `${isSlow ? 'slow' : 'norm'}:${text}`;
      let audioBuffer = ttsMemoryCache.get(cacheKey) || null;

      if (!audioBuffer) {
        audioBuffer = await fetchUpstreamTts(text, isSlow);
        if (audioBuffer) {
          if (ttsMemoryCache.size >= 300) {
            const oldestKey = ttsMemoryCache.keys().next().value;
            if (oldestKey) ttsMemoryCache.delete(oldestKey);
          }
          ttsMemoryCache.set(cacheKey, audioBuffer);
        }
      }

      if (!audioBuffer) {
        res.statusCode = 502;
        res.end('TTS upstream error');
        return;
      }

      const totalLength = audioBuffer.length;
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      const range = req.headers?.range;
      if (range && typeof range === 'string') {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : totalLength - 1;
        if (!isNaN(start) && !isNaN(end) && start >= 0 && end < totalLength && start <= end) {
          const chunkLength = end - start + 1;
          res.statusCode = 206;
          res.setHeader('Content-Range', `bytes ${start}-${end}/${totalLength}`);
          res.setHeader('Content-Length', String(chunkLength));
          res.end(audioBuffer.subarray(start, end + 1));
          return;
        }
      }

      res.statusCode = 200;
      res.setHeader('Content-Length', String(totalLength));
      res.end(audioBuffer);
    } catch (err) {
      console.error('TTS proxy error:', err);
      res.statusCode = 500;
      res.end('Internal TTS error');
    }
  };

  return {
    name: 'korean-tts-service',
    configureServer(server) {
      server.middlewares.use('/api/tts', ttsMiddleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tts', ttsMiddleware);
    },
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), koreanTtsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
