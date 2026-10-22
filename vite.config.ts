import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function koreanTtsPlugin(): Plugin {
  const ttsMiddleware = async (req: any, res: any) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const text = url.searchParams.get('text');
      if (!text) {
        res.statusCode = 400;
        res.end('Missing text parameter');
        return;
      }

      const isSlow = url.searchParams.get('slow') === 'true';
      const speedParam = isSlow ? '0.24' : '1';
      const targetUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ko&client=tw-ob&ttsspeed=${speedParam}&q=${encodeURIComponent(text)}`;

      const ttsRes = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!ttsRes.ok) {
        res.statusCode = ttsRes.status;
        res.end('TTS upstream error');
        return;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      const arrayBuffer = await ttsRes.arrayBuffer();
      res.end(Buffer.from(arrayBuffer));
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
