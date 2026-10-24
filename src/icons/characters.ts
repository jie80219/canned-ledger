// 囤囤角色風：帶臉的彩色圖示，48×48，自帶配色不跟 currentColor。

import type { Glyph } from './glyphs'

const INK = '#3d3328'
const BLUSH = '#f2a28f'

/** 眼睛、腮紅、微笑；(x, y) 是兩眼中點 */
function face(x: number, y: number, w = 5): string {
  return (
    `<circle cx="${x - w}" cy="${y}" r="1.9" fill="${INK}"/><circle cx="${x + w}" cy="${y}" r="1.9" fill="${INK}"/>` +
    `<ellipse cx="${x - w - 3}" cy="${y + 3.2}" rx="2.2" ry="1.3" fill="${BLUSH}" opacity=".85"/>` +
    `<ellipse cx="${x + w + 3}" cy="${y + 3.2}" rx="2.2" ry="1.3" fill="${BLUSH}" opacity=".85"/>` +
    `<path d="M${x - 2} ${y + 2.4}q2 2 4 0" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`
  )
}

const S = `stroke="${INK}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"`

export const CHARACTERS: Record<string, Glyph> = {
  'chr-meal': {
    name: '飯碗囤',
    tags: ['餐飲', '角色'],
    body: `<path d="M14 6l6 14M36 5l-10 15" ${S} fill="none"/><path d="M9 22c2-6 8-8 15-8s13 2 15 8Z" fill="#fffaf0" ${S}/><path d="M6 22h36a18 16 0 0 1-36 0Z" fill="#e8a65c" ${S}/>${face(24, 29)}`,
  },
  'chr-transit': {
    name: '公車囤',
    tags: ['交通', '角色'],
    body: `<rect x="9" y="6" width="30" height="33" rx="7" fill="#f2c94c" ${S}/><rect x="13" y="11" width="22" height="10" rx="2.5" fill="#cfe6f2" ${S}/><path d="M14 39v4M34 39v4" ${S}/><circle cx="14.5" cy="34" r="1.8" fill="#fffaf0"/><circle cx="33.5" cy="34" r="1.8" fill="#fffaf0"/>${face(24, 27)}`,
  },
  'chr-shop': {
    name: '提袋囤',
    tags: ['購物', '角色'],
    body: `<path d="M17 16v-3a7 7 0 0 1 14 0v3" fill="none" ${S}/><path d="M9 16h30l-2 26H11Z" fill="#d98c9f" ${S}/>${face(24, 28)}`,
  },
  'chr-home': {
    name: '小屋囤',
    tags: ['居家', '角色'],
    body: `<path d="M11 20v21h26V20" fill="#fbeedd" ${S}/><path d="M5 22 24 6l19 16" fill="#c9705a" ${S}/><path d="M20 41v-7a4 4 0 0 1 8 0v7" fill="#e8a65c" ${S}/>${face(24, 25)}`,
  },
  'chr-fun': {
    name: '手把囤',
    tags: ['娛樂', '遊戲', '角色'],
    body: `<path d="M14 13h20a10 10 0 0 1 9.6 12.8l-2 6.6A5 5 0 0 1 33 34.4L29 30H19l-4 4.4a5 5 0 0 1-8.6-2l-2-6.6A10 10 0 0 1 14 13Z" fill="#9aa6d6" ${S}/><path d="M12 19v6M9 22h6" ${S}/><circle cx="35" cy="19" r="1.8" fill="${INK}"/><circle cx="38" cy="23" r="1.8" fill="${INK}"/>${face(24, 21, 3.6)}`,
  },
  'chr-sub': {
    name: '電視囤',
    tags: ['訂閱', '影音', '角色'],
    body: `<path d="M17 4l7 7 7-7" fill="none" ${S}/><rect x="6" y="11" width="36" height="27" rx="6" fill="#85a8c9" ${S}/><rect x="11" y="16" width="26" height="17" rx="3" fill="#eaf3f8" ${S}/><path d="M16 38v4M32 38v4" ${S}/>${face(24, 23)}`,
  },
  'chr-med': {
    name: '膠囊囤',
    tags: ['醫療', '角色'],
    body: `<g transform="rotate(-30 24 24)"><path d="M24 14H14a10 10 0 0 0 0 20h10Z" fill="#e8786b" ${S}/><path d="M24 14h10a10 10 0 0 1 0 20H24Z" fill="#fffaf0" ${S}/></g>${face(24, 24, 4.5)}`,
  },
  'chr-edu': {
    name: '書本囤',
    tags: ['教育', '角色'],
    body: `<path d="M10 7h24a4 4 0 0 1 4 4v30H14a4 4 0 0 1-4-4Z" fill="#7fb59a" ${S}/><path d="M10 37a4 4 0 0 1 4-4h24" fill="none" ${S}/><path d="M16 12h16" ${S}/>${face(24, 21)}`,
  },
  'chr-social': {
    name: '對話囤',
    tags: ['社交', '聚餐', '角色'],
    body: `<path d="M24 7c10 0 18 6.5 18 15s-8 15-18 15c-2 0-4-.3-5.8-.8L9 41l2.4-7.6C8 30.6 6 26.5 6 22 6 13.5 14 7 24 7Z" fill="#f4c7a1" ${S}/>${face(24, 21)}`,
  },
  'chr-pet': {
    name: '囤囤',
    tags: ['寵物', '倉鼠', '角色'],
    body: `<circle cx="13" cy="12" r="6" fill="#e8a65c" ${S}/><circle cx="35" cy="12" r="6" fill="#e8a65c" ${S}/><ellipse cx="24" cy="27" rx="18" ry="16" fill="#e8a65c" ${S}/><ellipse cx="24" cy="31" rx="12" ry="10" fill="#fbeedd"/><circle cx="12" cy="29" r="6" fill="#fbeedd"/><circle cx="36" cy="29" r="6" fill="#fbeedd"/>${face(24, 24, 6)}`,
  },
  'chr-ins': {
    name: '盾牌囤',
    tags: ['保險', '角色'],
    body: `<path d="M24 5 9 11v11c0 9.5 6.4 16.6 15 19.5 8.6-2.9 15-10 15-19.5V11Z" fill="#7a9a6b" ${S}/><path d="M24 10 14 14v8c0 6.6 4.3 11.6 10 13.8Z" fill="#a3c08f"/>${face(24, 22)}`,
  },
  'chr-misc': {
    name: '紙箱囤',
    tags: ['其他', '包裹', '角色'],
    body: `<path d="M6 16h36v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z" fill="#c9a27e" ${S}/><path d="M6 16l5-8h26l5 8M20 16v6h8v-6" fill="#dfc09f" ${S}/>${face(24, 30)}`,
  },
  'chr-salary': {
    name: '金幣囤',
    tags: ['薪水', '收入', '存錢', '角色'],
    body: `<circle cx="24" cy="24" r="18" fill="#f2c94c" ${S}/><circle cx="24" cy="24" r="13.5" fill="none" stroke="#d9a91f" stroke-width="2"/><path d="M15 13a12 12 0 0 1 6-3" stroke="#fff6cf" stroke-width="2.4" stroke-linecap="round"/>${face(24, 23)}`,
  },
  'chr-bonus': {
    name: '紅包囤',
    tags: ['獎金', '紅包', '角色'],
    body: `<rect x="10" y="5" width="28" height="38" rx="4" fill="#e05a4f" ${S}/><path d="M10 14l14 8 14-8" fill="none" ${S}/><circle cx="24" cy="22" r="4" fill="#f2c94c" ${S}/>${face(24, 32)}`,
  },
  'chr-invest': {
    name: '小芽囤',
    tags: ['投資', '成長', '角色'],
    body: `<path d="M24 22V12" ${S}/><path d="M24 14c0-5 4-8 10-8 0 6-4 9-10 8ZM24 16c0-4-3-6-8-6 0 5 3 7 8 6Z" fill="#7fb59a" ${S}/><path d="M9 22h30l-3 20H12Z" fill="#e8a87c" ${S}/><path d="M8 22h32" ${S}/>${face(24, 31)}`,
  },
}

/** 大類 → 角色圖示 */
export const CATEGORY_CHARACTER: Record<string, string> = {
  餐飲: 'chr-meal',
  交通: 'chr-transit',
  購物: 'chr-shop',
  居家: 'chr-home',
  娛樂: 'chr-fun',
  訂閱: 'chr-sub',
  醫療: 'chr-med',
  教育: 'chr-edu',
  社交: 'chr-social',
  寵物: 'chr-pet',
  保險: 'chr-ins',
  其他: 'chr-misc',
  薪水: 'chr-salary',
  獎金: 'chr-bonus',
  投資: 'chr-invest',
}

export function characterSvg(id: string): string {
  const c = CHARACTERS[id]
  return c ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">${c.body}</svg>` : ''
}
