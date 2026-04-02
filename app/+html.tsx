import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#060610" />
        <meta name="background-color" content="#060610" />
        <meta name="description" content="Attention — Community safety platform with real-time incident reporting, monitoring, and family protection" />

        <link rel="preconnect" href="https://unpkg.com" />
        <link rel="preconnect" href="https://tiles.openfreemap.org" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@5.21.1/dist/maplibre-gl.css" />

        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root {
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: #060610;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
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
            transition: transform 0.15s cubic-bezier(0.2, 0, 0, 1), opacity 0.15s ease, background-color 0.2s ease;
          }

          ::-webkit-scrollbar {
            width: 6px;
          }
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }

          ::selection {
            background: rgba(0, 255, 170, 0.3);
            color: #fff;
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
