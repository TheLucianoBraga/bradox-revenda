import { useMemo } from "react";
import DOMPurify from "dompurify";

const CONFIG = {
  ALLOWED_TAGS: ["b", "strong", "i", "em", "u", "s", "strike", "br", "p", "div", "span", "h1", "h2", "h3", "ul", "ol", "li", "a", "blockquote", "code", "pre", "img", "figure", "figcaption"],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "style", "width", "height"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

export function RichTextView({ html, className = "" }: { html: string; className?: string }) {
  const safe = useMemo(() => {
    const clean = DOMPurify.sanitize(html || "", CONFIG);
    // Force safe link attrs
    return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer nofollow" ');
  }, [html]);
  return <div className={`rte-content ${className}`} dangerouslySetInnerHTML={{ __html: safe }} />;
}
