import katex from 'katex'

/**
 * Renders math formulas in HTML content.
 * Converts <span data-type="math-inline" data-latex="..."> and
 * <div data-type="math-block" data-latex="..."> to rendered KaTeX HTML.
 */
export function useRenderMath() {
  function renderMathInHtml(html: string): string {
    if (!html) return ''

    // Render inline math: <span data-type="math-inline" data-latex="...">...</span>
    html = html.replace(
      /<span[^>]*data-type="math-inline"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/span>/g,
      (_match, latex) => {
        try {
          const decoded = decodeHtmlEntities(latex)
          return katex.renderToString(decoded, { throwOnError: false, displayMode: false })
        } catch {
          return `<span class="text-red-500">[Math error]</span>`
        }
      }
    )

    // Also handle data-latex before data-type
    html = html.replace(
      /<span[^>]*data-latex="([^"]*)"[^>]*data-type="math-inline"[^>]*>[\s\S]*?<\/span>/g,
      (_match, latex) => {
        try {
          const decoded = decodeHtmlEntities(latex)
          return katex.renderToString(decoded, { throwOnError: false, displayMode: false })
        } catch {
          return `<span class="text-red-500">[Math error]</span>`
        }
      }
    )

    // Render block math: <div data-type="math-block" data-latex="...">...</div>
    html = html.replace(
      /<div[^>]*data-type="math-block"[^>]*data-latex="([^"]*)"[^>]*>[\s\S]*?<\/div>/g,
      (_match, latex) => {
        try {
          const decoded = decodeHtmlEntities(latex)
          return `<div class="math-block-rendered">${katex.renderToString(decoded, { throwOnError: false, displayMode: true })}</div>`
        } catch {
          return `<div class="text-red-500">[Math error]</div>`
        }
      }
    )

    // Also handle data-latex before data-type for block
    html = html.replace(
      /<div[^>]*data-latex="([^"]*)"[^>]*data-type="math-block"[^>]*>[\s\S]*?<\/div>/g,
      (_match, latex) => {
        try {
          const decoded = decodeHtmlEntities(latex)
          return `<div class="math-block-rendered">${katex.renderToString(decoded, { throwOnError: false, displayMode: true })}</div>`
        } catch {
          return `<div class="text-red-500">[Math error]</div>`
        }
      }
    )

    return html
  }

  function decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
  }

  return { renderMathInHtml }
}
