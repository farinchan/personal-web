import { createHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-dark'],
      langs: [
        'javascript', 'typescript', 'python', 'java', 'c', 'cpp', 'csharp',
        'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'bash',
        'html', 'css', 'scss', 'json', 'xml', 'yaml', 'markdown',
        'dockerfile', 'graphql', 'lua', 'r', 'perl', 'dart', 'ini',
      ],
    })
  }
  return highlighterPromise
}

/**
 * Highlights code blocks in HTML content using Shiki.
 * Replaces <pre><code class="language-xxx">...</code></pre> with syntax-highlighted HTML.
 */
export function useCodeHighlight() {
  async function highlightCodeBlocks(html: string): Promise<string> {
    if (!html || !import.meta.client) return html

    // Match <pre><code class="language-xxx">...</code></pre>
    const codeBlockRegex = /<pre><code class="language-(\w+)">([\s\S]*?)<\/code><\/pre>/g
    const matches = [...html.matchAll(codeBlockRegex)]

    if (matches.length === 0) return html

    try {
      const highlighter = await getHighlighter()

      for (const match of matches) {
        const [fullMatch, lang = 'text', encodedCode = ''] = match
        const code = decodeHtmlEntities(encodedCode)
        const loadedLangs = highlighter.getLoadedLanguages()

        const effectiveLang = loadedLangs.includes(lang as any) ? lang : 'text'

        const highlighted = highlighter.codeToHtml(code, {
          lang: effectiveLang as string,
          theme: 'github-dark',
        })

        html = html.replace(fullMatch, highlighted)
      }
    } catch (err) {
      console.error('Code highlight error:', err)
    }

    return html
  }

  return { highlightCodeBlocks }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
}
