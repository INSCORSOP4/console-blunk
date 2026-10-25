"use client";

import { useRef, useState } from "react";

/**
 * Muestra HTML externo (correos de tickets) de forma segura: iframe con `sandbox` sin scripts,
 * CSP que bloquea todo salvo imágenes y estilos en línea, y enlaces que abren en otra pestaña.
 * `allow-same-origin` (sin `allow-scripts`) solo sirve para medir la altura del contenido.
 */
export function HtmlFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(160);

  const doc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https: http:; style-src 'unsafe-inline'; font-src data:">
<base target="_blank">
<style>body{margin:0;padding:16px;font:14px/1.55 system-ui,sans-serif;color:#1c2330;background:#fff;overflow-wrap:anywhere}img{max-width:100%;height:auto}table{max-width:100%}a{color:#c2410c}</style>
</head><body>${html}</body></html>`;

  return (
    <iframe
      ref={ref}
      title={title}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      srcDoc={doc}
      referrerPolicy="no-referrer"
      loading="lazy"
      scrolling="no"
      style={{ height }}
      className="block w-full rounded-lg border bg-white"
      onLoad={() => {
        const body = ref.current?.contentDocument?.body;
        if (body) setHeight(Math.min(Math.max(body.scrollHeight + 8, 120), 4000));
      }}
    />
  );
}
