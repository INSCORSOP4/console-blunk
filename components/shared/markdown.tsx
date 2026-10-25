"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { ENLACE_ROTO } from "@/lib/kb/markdown";

type Props = { children: string };

/**
 * Renderiza Markdown de forma segura. Defensas, de afuera hacia adentro:
 *  - `skipHtml`: el HTML en línea de las notas no se interpreta.
 *  - `rehype-sanitize`: elimina atributos y protocolos peligrosos (javascript:, data:...).
 *  - Enlaces: solo http(s) abre en otra pestaña (con noopener); lo demás no es un enlace.
 *  - Imágenes: no se cargan (evita rastreo y contenido externo); se muestra un marcador.
 * El resaltado y los ids de encabezados se aplican DESPUÉS de sanitizar, así que solo añaden contenido propio.
 */
export function Markdown({ children }: Props) {
  return (
    <div className="prose-kb">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSanitize,
          rehypeSlug,
          [rehypeHighlight, { detect: false, ignoreMissing: true }],
        ]}
        components={{
          a: Enlace,
          img: ({ alt }) => (
            <span
              className="text-muted-foreground italic"
              title="Las imágenes no se cargan en la base de conocimiento"
            >
              [imagen{alt ? `: ${alt}` : ""}]
            </span>
          ),
          table: ({ children }) => (
            <div className="tabla-scroll">
              <table>{children}</table>
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function Enlace({ href, children }: ComponentProps<"a">) {
  if (!href) return <span>{children}</span>;

  if (href === ENLACE_ROTO)
    return (
      <span
        className="enlace-roto"
        title="La nota enlazada todavía no existe en la base de conocimiento"
      >
        {children}
      </span>
    );

  if (href.startsWith("/conocimiento/")) return <Link href={href}>{children}</Link>;
  if (href.startsWith("#")) return <a href={href}>{children}</a>;

  if (/^https?:\/\//i.test(href))
    return (
      <a href={href} target="_blank" rel="noopener noreferrer nofollow">
        {children}
      </a>
    );

  if (/^mailto:/i.test(href)) return <a href={href}>{children}</a>;
  return <span>{children}</span>; // rutas relativas u otros esquemas: no se enlazan
}
