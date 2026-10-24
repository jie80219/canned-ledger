// 銀行圖示：48×48 整格，依各家品牌色與 logo 輪廓簡化重畫，不是官方檔案。

export interface Bank {
  name: string
  color: string
  body: string
}

const T = (s: string, c = '#fff', size = 22) =>
  `<text x="24" y="25" text-anchor="middle" dominant-baseline="central" font-family="-apple-system,'PingFang TC','Noto Sans TC',sans-serif" font-weight="800" font-size="${size}" fill="${c}">${s}</text>`
const tile = (c: string) => `<rect width="48" height="48" rx="14" fill="${c}"/>`
const paper = '<rect width="48" height="48" rx="14" fill="#fff"/>'

export const BANKS: Record<string, Bank> = {
  'bank-ubot': {
    name: '聯邦銀行',
    color: '#1d4f9c',
    body: `${paper}<path d="M8 10h7v17a5 5 0 0 0 10 0V10h-0" fill="none" stroke="#1d4f9c" stroke-width="7"/><path d="M27 9h9l6 7-6 7h-9l6-7Z" fill="#1a9aa0"/><path d="M27 25h9l6 7-6 7h-9l6-7Z" fill="#e2134f"/>`,
  },
  'bank-ctbc': {
    name: '中國信託',
    color: '#e60012',
    body: `${paper}<g fill="#e60012">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="24" cy="13" rx="7" ry="9" transform="rotate(${r} 24 24)"/>`).join('')}</g><circle cx="24" cy="24" r="5" fill="#fff"/><circle cx="24" cy="24" r="2.5" fill="#00a050"/>`,
  },
  'bank-mega': {
    name: '兆豐銀行',
    color: '#b8862b',
    body: `${paper}<circle cx="24" cy="24" r="19" fill="#c99a3c"/><path d="M24 5a19 19 0 0 1 0 38" fill="#8a6118"/><path d="M33 10C22 8 14 14 21 21s5 15-6 17" fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round"/>`,
  },
  'bank-first': {
    name: '第一銀行',
    color: '#0b7a4b',
    body: `${paper}<path d="M38 12A18 18 0 1 0 38 36" fill="none" stroke="#b8862b" stroke-width="5" stroke-linecap="round"/><path d="M33 16A12 12 0 1 0 33 32" fill="none" stroke="#0b7a4b" stroke-width="4" stroke-linecap="round"/><path d="M24 17l7 7-7 7-7-7Z" fill="#c99a3c"/>`,
  },
  'bank-post': {
    name: '中華郵政',
    color: '#2d4fa8',
    body: `${paper}<circle cx="24" cy="24" r="17" fill="none" stroke="#2d4fa8" stroke-width="4"/>${T('郵', '#e2231a', 18)}`,
  },
  'bank-taishin': {
    name: '台新銀行',
    color: '#d6001c',
    body: `${paper}<path d="M8 8h32v10H18v4h22v18H8V30h22v-4H8Z" fill="#d6001c"/><path d="M14 13h20M14 35h20" stroke="#fff" stroke-width="2"/>`,
  },
  'bank-linepay': {
    name: 'LINE Pay',
    color: '#06c755',
    body: `${tile('#06c755')}${T('Pay', '#fff', 17)}`,
  },
  'bank-sinopac': {
    name: '永豐銀行',
    color: '#e5141b',
    body: `<circle cx="24" cy="24" r="22" fill="#e5141b"/><path d="M10 15h28" stroke="#fff" stroke-width="4"/><path d="M17 20v10c0 3-2 5-6 5M31 20v10c0 3 2 5 6 5M24 20v18" fill="none" stroke="#fff" stroke-width="4"/>`,
  },
  'bank-yuanta': {
    name: '元大',
    color: '#1561b0',
    body: `${paper}<g transform="translate(24 24)">${['#1561b0', '#2a7fd0', '#5aa6e6', '#1561b0', '#2a7fd0', '#5aa6e6']
      .map((c, i) => `<path d="M-4-7h8l5-12H-9Z" fill="${c}" transform="rotate(${i * 60})"/>`)
      .join('')}</g>`,
  },
  'bank-firstrade': {
    name: 'Firstrade',
    color: '#123f7f',
    body: `${tile('#123f7f')}<path d="M24 8l13 15-11-5v22h-4V18l-11 5Z" fill="#fff"/>`,
  },
  'bank-cathay': {
    name: '國泰世華',
    color: '#00a160',
    body: `${paper}<circle cx="24" cy="19" r="12" fill="#00a160"/><circle cx="15" cy="23" r="7" fill="#3cbf7f"/><circle cx="33" cy="23" r="7" fill="#3cbf7f"/><path d="M22 27h4v14h-4Z" fill="#00a160"/>`,
  },
  'bank-esun': {
    name: '玉山銀行',
    color: '#009b8f',
    body: `<circle cx="24" cy="24" r="22" fill="#009b8f"/><path d="M8 30l7-6 4 2 6-9 4 6 3-2 8 9-6-3-3 1-5-5-6 7-4-3Z" fill="#fff"/>`,
  },
  'bank-fubon': {
    name: '台北富邦',
    color: '#0071bc',
    body: `${tile('#0071bc')}<path d="M14 36V14c0-2 1-3 3-3h18v6H21v5h12v6H21v8Z" fill="#fff"/><circle cx="35" cy="34" r="3" fill="#36c2e8"/>`,
  },
  'bank-bot': {
    name: '臺灣銀行',
    color: '#1b3f8b',
    body: `${paper}<circle cx="24" cy="24" r="19" fill="#1b3f8b"/><circle cx="24" cy="24" r="15" fill="none" stroke="#e8c15a" stroke-width="1.5"/>${T('臺', '#fff', 17)}`,
  },
  'bank-tcb': {
    name: '合作金庫',
    color: '#00964c',
    body: `${tile('#00964c')}${T('合庫', '#fff', 15)}`,
  },
  'bank-hncb': {
    name: '華南銀行',
    color: '#d7182a',
    body: `${tile('#d7182a')}${T('華南', '#fff', 15)}`,
  },
  'bank-chb': {
    name: '彰化銀行',
    color: '#0b5aa6',
    body: `${tile('#0b5aa6')}${T('彰銀', '#fff', 15)}`,
  },
  'bank-landbank': {
    name: '土地銀行',
    color: '#2b8a3e',
    body: `${tile('#2b8a3e')}${T('土銀', '#fff', 15)}`,
  },
  'bank-scsb': {
    name: '上海商銀',
    color: '#e85d75',
    body: `<defs><linearGradient id="scsb" x1="0" x2="1"><stop offset="0" stop-color="#f6c23e"/><stop offset=".5" stop-color="#f08a4b"/><stop offset="1" stop-color="#d6337a"/></linearGradient></defs><circle cx="24" cy="24" r="21" fill="url(#scsb)"/><path d="M15 8v32M21 4v40M27 4v40M33 8v32" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>`,
  },
  'bank-dbs': {
    name: '星展銀行',
    color: '#ff3e3e',
    body: `${tile('#ee2a2f')}<path d="M24 9c1 8 7 14 15 15-8 1-14 7-15 15-1-8-7-14-15-15 8-1 14-7 15-15Z" fill="#fff"/>`,
  },
}

export function bankSvg(id: string): string {
  const b = BANKS[id]
  return b ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">${b.body}</svg>` : ''
}
