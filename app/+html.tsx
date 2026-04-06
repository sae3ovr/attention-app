import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#0D1117" />
        <meta name="background-color" content="#0D1117" />
        <meta name="description" content="Alert.io — From alert to action. Community safety platform with real-time incident reporting, monitoring, and family protection." />

        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #0D1117;
            overflow: hidden;
            font-family: 'Courier New', monospace, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          #root {
            display: flex;
            flex-direction: column;
          }

          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }

          button, [role="button"] {
            transition: transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.2s ease, background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
          }

          input, textarea {
            transition: border-color 0.25s ease, box-shadow 0.25s ease, background-color 0.25s ease;
          }

          input:focus, textarea:focus {
            border-color: rgba(0, 255, 136, 0.4) !important;
            box-shadow: 0 0 0 3px rgba(0, 255, 136, 0.08), 0 0 16px rgba(0, 255, 136, 0.06);
            outline: none;
          }

          ::-webkit-scrollbar {
            width: 5px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.16);
          }

          ::selection {
            background: rgba(0, 255, 136, 0.25);
            color: #fff;
          }

          ::placeholder {
            transition: color 0.2s ease;
          }

          @keyframes overlay-slide-in {
            from { opacity: 0; transform: translateY(12px) scale(0.97); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.001ms !important;
              transition-duration: 0.001ms !important;
            }
          }

          @media (prefers-contrast: more) {
            :root {
              --high-contrast: 1;
            }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
