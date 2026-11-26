import { preloadFile } from '@pierre/diffs/ssr'
import { CODE_BLOCK_OPTIONS } from './diffs-options'

const STYLE_TAGS = /<style[^>]*>[\s\S]*?<\/style>/g
const ICON_SPRITE = /<svg data-icon-sprite[\s\S]*?<\/svg>/g

async function preload(code: string, filename: string): Promise<string> {
  const { prerenderedHTML } = await preloadFile({
    file: { name: filename, contents: code },
    options: CODE_BLOCK_OPTIONS,
  })
  return prerenderedHTML
}

export async function renderDiffsStyles(): Promise<string> {
  const html = await preload('{}\n', 'seed.jsonc')
  return (html.match(STYLE_TAGS) ?? []).join('\n').replaceAll(':host', '.diffs-code')
}

export async function renderCodeBlock(code: string, filename: string): Promise<string> {
  const html = await preload(code, filename)
  return html.replace(ICON_SPRITE, '').replace(STYLE_TAGS, '')
}
