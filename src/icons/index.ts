import { glyphSvg, GLYPHS, CATEGORY_GLYPHS } from './glyphs'
import { characterSvg, CHARACTERS, CATEGORY_CHARACTER } from './characters'
import { bankSvg, BANKS } from './banks'

export { GLYPHS, CATEGORY_GLYPHS, CHARACTERS, CATEGORY_CHARACTER, BANKS }

export type IconKind = 'emoji' | 'svg' | 'chr' | 'img' | 'txt'

/** 解析 icon 字串：無前綴為 emoji，其餘見 SPEC-v2 §6.1 */
export function parseIcon(icon: string | undefined): { kind: IconKind; value: string } {
  const s = icon ?? ''
  if (s.startsWith('svg:')) {
    const id = s.slice(4)
    return { kind: id in CHARACTERS || id in BANKS ? 'chr' : 'svg', value: id }
  }
  if (s.startsWith('img:')) return { kind: 'img', value: s.slice(4) }
  if (s.startsWith('txt:')) return { kind: 'txt', value: s.slice(4) }
  return { kind: 'emoji', value: s }
}

export function iconSvg(id: string): string {
  return id in CHARACTERS ? characterSvg(id) : id in BANKS ? bankSvg(id) : glyphSvg(id)
}

/** 純文字場合（<option>、圖表標籤）用：emoji 原樣回傳，其他圖示沒辦法放進文字就回空字串 */
export function iconText(icon: string | undefined): string {
  const p = parseIcon(icon)
  return p.kind === 'emoji' ? p.value : ''
}

/** 依名稱推薦：該分類的自繪圖示 + 角色版 */
export function recommendIcons(name: string): string[] {
  const ids = [...(CATEGORY_GLYPHS[name] ?? [])]
  const chr = CATEGORY_CHARACTER[name]
  if (chr) ids.push(chr)
  return ids.map((id) => `svg:${id}`)
}
