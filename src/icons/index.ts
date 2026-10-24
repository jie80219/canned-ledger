import { glyphSvg, GLYPHS, CATEGORY_GLYPHS } from './glyphs'
import { characterSvg, CHARACTERS, CATEGORY_CHARACTER } from './characters'

export { GLYPHS, CATEGORY_GLYPHS, CHARACTERS, CATEGORY_CHARACTER }

export type IconKind = 'emoji' | 'svg' | 'chr' | 'img' | 'txt'

/** 解析 icon 字串：無前綴為 emoji，其餘見 SPEC-v2 §6.1 */
export function parseIcon(icon: string | undefined): { kind: IconKind; value: string } {
  const s = icon ?? ''
  if (s.startsWith('svg:')) {
    const id = s.slice(4)
    return { kind: id in CHARACTERS ? 'chr' : 'svg', value: id }
  }
  if (s.startsWith('img:')) return { kind: 'img', value: s.slice(4) }
  if (s.startsWith('txt:')) return { kind: 'txt', value: s.slice(4) }
  return { kind: 'emoji', value: s }
}

export function iconSvg(id: string): string {
  return id in CHARACTERS ? characterSvg(id) : glyphSvg(id)
}
