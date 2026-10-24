// 銀行圖示：多數是官網或維基共享資源的官方 logo 縮成 128px；聯邦、彰銀、上海商銀、星展照官方 logo 等比例重描成 SVG。

export interface Bank {
  name: string
  color: string
  body: string
}

const PNG = import.meta.glob<string>('./banks/*.png', { eager: true, query: '?url', import: 'default' })
const img = (id: string) => `<image href="${PNG[`./banks/${id}.png`]}" width="48" height="48"/>`
const paper = '<rect width="48" height="48" fill="#fff"/>'
const SCSB = ['#f5c400', '#f2a900', '#ef8c00', '#ea6a0c', '#c7348c', '#cf2a7c', '#df1460', '#e4003a']

export const BANKS: Record<string, Bank> = {
  'bank-ubot': {
    name: '聯邦銀行',
    color: '#1d4f9c',
    body: `${paper}<g transform="translate(4 4) scale(.833)"><path d="M1 5h10v28a5 5 0 0 0 10 0V5h5.5v28a10.5 10.5 0 0 1-10.5 10.5H11.5A10.5 10.5 0 0 1 1 33Z" fill="#0b4ea2"/><path d="M26.5 5h10l10 10-10 10h-10l7-10Z" fill="#008a96"/><path d="M26.5 25h10l10 10-10 10h-10l7-10Z" fill="#e4003a"/></g>`,
  },
  'bank-ctbc': {
    name: '中國信託',
    color: '#e60012',
    body: img('ctbc'),
  },
  'bank-mega': {
    name: '兆豐銀行',
    color: '#b8862b',
    body: img('mega'),
  },
  'bank-first': {
    name: '第一銀行',
    color: '#0b7a4b',
    body: img('first'),
  },
  'bank-post': {
    name: '中華郵政',
    color: '#2d4fa8',
    body: img('post'),
  },
  'bank-taishin': {
    name: '台新銀行',
    color: '#d6001c',
    body: img('taishin'),
  },
  'bank-linepay': {
    name: 'LINE Pay',
    color: '#06c755',
    body: img('linepay'),
  },
  'bank-sinopac': {
    name: '永豐銀行',
    color: '#e5141b',
    body: img('sinopac'),
  },
  'bank-yuanta': {
    name: '元大',
    color: '#1561b0',
    body: img('yuanta'),
  },
  'bank-firstrade': {
    name: 'Firstrade',
    color: '#123f7f',
    body: img('firstrade'),
  },
  'bank-cathay': {
    name: '國泰世華',
    color: '#00a160',
    body: img('cathay'),
  },
  'bank-esun': {
    name: '玉山銀行',
    color: '#009b8f',
    body: img('esun'),
  },
  'bank-fubon': {
    name: '台北富邦',
    color: '#0071bc',
    body: img('fubon'),
  },
  'bank-bot': {
    name: '臺灣銀行',
    color: '#e3abca',
    body: img('bot'),
  },
  'bank-tcb': {
    name: '合作金庫',
    color: '#00964c',
    body: img('tcb'),
  },
  'bank-hncb': {
    name: '華南銀行',
    color: '#d7182a',
    body: img('hncb'),
  },
  'bank-chb': {
    name: '彰化銀行',
    color: '#0b5aa6',
    body: `<rect width="48" height="48" fill="#ee2a24"/><rect x="5" y="5" width="38" height="38" fill="none" stroke="#fff" stroke-width="1.2"/><text x="24" y="24" text-anchor="middle" dominant-baseline="central" font-family="Didot,'Bodoni 72',Georgia,serif" font-size="15" font-weight="700" fill="none" stroke="#fff" stroke-width=".9">CHB</text><path d="M5 35h38" stroke="#fff" stroke-width="1.2"/>`,
  },
  'bank-landbank': {
    name: '土地銀行',
    color: '#2b8a3e',
    body: img('landbank'),
  },
  'bank-scsb': {
    name: '上海商銀',
    color: '#e85d75',
    body: `${paper}<clipPath id="scsb"><circle cx="24" cy="24" r="19"/></clipPath><g clip-path="url(#scsb)">${SCSB.map((c, i) => `<rect x="${5 + i * 4.75}" y="5" width="4.8" height="38" fill="${c}"/>`).join('')}</g>`,
  },
  'bank-dbs': {
    name: '星展銀行',
    color: '#ff3e3e',
    body: `${paper}<g transform="translate(24 24) scale(1.25) translate(-13.4 -13.7)" fill-rule="evenodd"><path d="M4.457 22.731h17.883V4.667H4.457Z" fill="#fff"/><path d="M21.75,22.16 L15.26,16.66 C15.26,16.66 14.38,15.8 13.40,15.8 C12.40,15.8 11.52,16.66 11.52,16.66 L5.03,22.16 L5.01,22.14 L10.46,15.59 C10.46,15.59 11.31,14.70 11.31,13.69 C11.31,12.69 10.46,11.81 10.46,11.81 L5.01,5.25 L5.03,5.23 L11.52,10.73 C11.52,10.73 12.40,11.60 13.40,11.60 C14.38,11.60 15.26,10.73 15.26,10.73 L21.75,5.23 L21.78,5.25 L16.32,11.81 C16.32,11.81 15.47,12.69 15.47,13.69 C15.47,14.70 16.32,15.59 16.32,15.59 L21.78,22.14 L21.75,22.16 Z M24.79,13.69 L24.79,13.69 C24.79,11.91 24.86,10.32 26.16,7.52 C26.54,6.71 27.38,5.52 26.15,4.14 C25.15,3.13 24.01,3.30 23.25,3.74 C23.69,2.97 23.85,1.82 22.85,0.81 C21.48,-0.42 20.31,0.41 19.50,0.8 C16.73,2.12 15.16,2.19 13.40,2.19 C11.62,2.19 10.05,2.12 7.29,0.8 C6.48,0.41 5.30,-0.42 3.93,0.81 C2.93,1.82 3.10,2.97 3.54,3.74 C2.78,3.3 1.64,3.13 0.64,4.14 C-0.58,5.52 0.25,6.71 0.62,7.52 C1.93,10.32 2.00,11.91 2.00,13.69 C2.00,15.48 1.93,17.07 0.62,19.87 C0.25,20.68 -0.58,21.87 0.64,23.25 C1.64,24.26 2.78,24.09 3.54,23.65 C3.10,24.43 2.93,25.57 3.93,26.57 C5.30,27.82 6.48,26.98 7.29,26.59 C10.06,25.27 11.62,25.20 13.40,25.20 C15.16,25.20 16.73,25.27 19.50,26.59 C20.31,26.98 21.48,27.82 22.85,26.57 C23.85,25.57 23.68,24.43 23.25,23.65 C24.01,24.09 25.15,24.26 26.15,23.25 C27.38,21.87 26.54,20.68 26.16,19.87 C24.86,17.07 24.79,15.48 24.79,13.69 L24.79,13.69 Z" fill="#ff3333"/></g>`,
  },
}

export function bankSvg(id: string): string {
  const b = BANKS[id]
  return b ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">${b.body}</svg>` : ''
}
