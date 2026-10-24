// 寵物：120×120，3 種 × 4 個成長階段 × 4 種心情，另有「餓」的空碗。

import type { Mood, Species, Stage } from '../domain/pet'

const INK = '#3d3328'
const BLUSH = '#f2a28f'
const S = `stroke="${INK}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"`

const FUR: Record<Species, { fur: string; belly: string; inner: string }> = {
  hamster: { fur: '#e9b47c', belly: '#fff4e2', inner: '#f3b6a6' },
  squirrel: { fur: '#c97a3d', belly: '#f8e3c8', inner: '#e8a477' },
  rabbit: { fur: '#f4ede6', belly: '#ffffff', inner: '#f3b6c0' },
}

function eyes(mood: Mood, x: number, y: number, w: number): string {
  if (mood === 'happy')
    return `<path d="M${x - w - 4} ${y + 1}q4-5 8 0M${x + w - 4} ${y + 1}q4-5 8 0" fill="none" ${S}/>`
  const dot = `<circle cx="${x - w}" cy="${y}" r="3.2" fill="${INK}"/><circle cx="${x + w}" cy="${y}" r="3.2" fill="${INK}"/><circle cx="${x - w + 1}" cy="${y - 1.2}" r="1" fill="#fff"/><circle cx="${x + w + 1}" cy="${y - 1.2}" r="1" fill="#fff"/>`
  if (mood === 'worried') return dot + `<path d="M${x - w - 5} ${y - 8}l7 2M${x + w + 5} ${y - 8}l-7 2" ${S}/>`
  if (mood === 'sad') return dot + `<path d="M${x - w - 5} ${y - 6}l7-2M${x + w + 5} ${y - 6}l-7-2" ${S}/><path d="M${x + w + 2} ${y + 4}q2 5 0 7q-2-2 0-7Z" fill="#8fc6e8"/>`
  return dot
}

function mouth(mood: Mood, x: number, y: number): string {
  if (mood === 'happy') return `<path d="M${x - 5} ${y}h10a5 5 0 0 1-10 0Z" fill="#c9605a" ${S}/>`
  if (mood === 'worried') return `<path d="M${x - 5} ${y + 2}q2.5-3 5 0t5 0" fill="none" ${S}/>`
  if (mood === 'sad') return `<path d="M${x - 4} ${y + 3}q4-4 8 0" fill="none" ${S}/>`
  return `<path d="M${x - 4} ${y}q2 2.5 4 0q2 2.5 4 0" fill="none" ${S}/>`
}

function face(mood: Mood, x: number, y: number, w = 10): string {
  return (
    eyes(mood, x, y, w) +
    `<ellipse cx="${x - w - 6}" cy="${y + 7}" rx="4.5" ry="2.6" fill="${BLUSH}" opacity=".8"/><ellipse cx="${x + w + 6}" cy="${y + 7}" rx="4.5" ry="2.6" fill="${BLUSH}" opacity=".8"/>` +
    mouth(mood, x, y + 8)
  )
}

function egg(species: Species, mood: Mood, crack: number): string {
  const c = FUR[species]
  const cracks = ['M44 48l6 6 5-5 6 6', 'M66 40l5 6 6-4', 'M52 86l5-6 6 5 5-4'].slice(0, crack)
  return (
    `<path d="M60 14c22 0 36 34 36 58a36 34 0 0 1-72 0c0-24 14-58 36-58Z" fill="#fffaf0" ${S}/>` +
    `<circle cx="44" cy="70" r="7" fill="${c.fur}" opacity=".7"/><circle cx="76" cy="58" r="5" fill="${c.fur}" opacity=".7"/><circle cx="70" cy="90" r="6" fill="${c.fur}" opacity=".7"/>` +
    cracks.map((d) => `<path d="${d}" fill="none" ${S}/>`).join('') +
    eyes(mood, 60, 66, 8)
  )
}

function ears(species: Species): string {
  const c = FUR[species]
  if (species === 'rabbit')
    return [44, 76].map((x, i) => `<g transform="rotate(${i ? 10 : -10} ${x} 46)"><ellipse cx="${x}" cy="22" rx="9" ry="24" fill="${c.fur}" ${S}/><ellipse cx="${x}" cy="24" rx="4" ry="16" fill="${c.inner}"/></g>`).join('')
  if (species === 'squirrel')
    return `<path d="M30 46 34 20l14 18M90 46 86 20 72 38" fill="${c.fur}" ${S}/><path d="M35 26l-1-7M85 26l1-7" ${S}/>`
  return [36, 84].map((x) => `<circle cx="${x}" cy="40" r="10" fill="${c.fur}" ${S}/><circle cx="${x}" cy="41" r="5.5" fill="${c.inner}"/>`).join('')
}

function creature(species: Species, mood: Mood, stage: Stage): string {
  const c = FUR[species]
  const tail =
    species === 'squirrel'
      ? `<path d="M86 96c22 4 30-20 20-40-8-16-26-14-24 0 10-6 18 4 12 18-4 10-10 14-8 22Z" fill="#b5652a" ${S}/>`
      : species === 'rabbit'
        ? `<circle cx="92" cy="94" r="8" fill="#fff" ${S}/>`
        : ''
  const cheeks = species === 'hamster' ? `<ellipse cx="34" cy="76" rx="9" ry="8" fill="${c.belly}" opacity=".9"/><ellipse cx="86" cy="76" rx="9" ry="8" fill="${c.belly}" opacity=".9"/>` : ''
  const extra =
    stage === 3
      ? `<path d="M34 92q26 12 52 0l-2 8q-24 10-48 0Z" fill="#c9605a" ${S}/><path d="M74 96l6 14 6-12" fill="#c9605a" ${S}/>`
      : stage === 2
        ? `<path d="M60 30c-2-8 4-14 12-14-1 8-6 13-12 14Z" fill="#7a9a6b" ${S}/>`
        : ''
  return (
    tail +
    ears(species) +
    `<path d="M60 34c26 0 38 22 38 46 0 22-16 30-38 30s-38-8-38-30c0-24 12-46 38-46Z" fill="${c.fur}" ${S}/>` +
    `<ellipse cx="60" cy="92" rx="20" ry="15" fill="${c.belly}"/>` +
    cheeks +
    `<path d="M42 104v4M78 104v4" ${S}/>` +
    face(mood, 60, 66) +
    extra
  )
}

const BOWL = `<g transform="translate(88 92)"><path d="M0 8h26a13 9 0 0 1-26 0Z" fill="#cfe6f2" ${S}/><path d="M6 2q2-4 0-7M14 2q2-4 0-7" fill="none" stroke="#b9ae9f" stroke-width="2" stroke-linecap="round"/></g>`

export function petSvg(species: Species, stage: Stage, mood: Mood, opts: { hungry?: boolean; crack?: number } = {}): string {
  const scale = [1, 0.74, 0.86, 1][stage]
  const body = stage === 0 ? egg(species, mood, opts.crack ?? 0) : creature(species, mood, stage)
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" aria-hidden="true">` +
    `<ellipse cx="60" cy="112" rx="${34 * scale}" ry="4" fill="${INK}" opacity=".12"/>` +
    `<g transform="translate(60 112) scale(${scale}) translate(-60 -112)">${body}</g>` +
    (opts.hungry ? BOWL : '') +
    `</svg>`
  )
}
