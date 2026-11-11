const MJTiles = (() => {
  const FONT = 'data:font/woff2;base64,d09GMgABAAAAAAhEABAAAAAADhgAAAfsAAGHrgAAAAAAAAAAAAAAAAAAAAAAAAAAGyAcQgZgAHwRCAqPaIx8ATYCJAMYCxgABCAFhUoHIAwHFyQYGBuAC1GUT1IA4OdhbMxsOgYRlSYaezohplPOVynCgHgaD1/7/c7d/eKIxt8CSTSRVEsSm05jCBXSS4FGZ6iadwhPu7hx5XWiU/x7Yvew2AbEwKL+v3OZ2MWuHZMHev7876UDAAuUycQeALshSi4ZMaHm81yqZoylY3lAEuII3e2fOTrmsoS6np9IC9wr7aklK1itr1QgWuC1bYTYfjWAeCn1Uv2NvUQAOvSMoLmMPAGIoADFgdE2/gRJ8L08du0tdhB01LmqYeU5Lmuuk5xJyjznZV2bW50gdXItX4e+AgxID7ANAAszIjZBSPgJU8IB61v7Wy1uZFpB0jIY6oe0OEYCtRZkiGpUvMM7KDUESZM0Y3KVgoYVVftZTBND4MugIBeQBe0KxhZMLW4obrLcGerncKB772/QJsfr700rNvXa1Hn93PVzVgX0uQ8gjCA/VIoReVc6HT0LpArIlwJqCCrKFMylyEx8Klohk2UN0RRUr3STSRmDlkTZYxavMz5aTs3HjIgk2V6RJiKbRdw2ea9h0YzSh9ToZ4M1TiLm27Bql+3atjOwiosbcfYWm4GToj7mxg5aXIkmw7QOPHegR8yvSJOKwF8rnipxV+cOz1327RkXdTeF93yPyXqs2lLKIunz15MkgsrATqV81C/Q5eOQqXAVDFR4aXGRN2+McT65uvcqNdqABo0LGifDiCk1iJBgQ2473OWTahSV5Xtqp23gZiR5K/T1uVNoSHomgEm1St0X4tVb8+Owyz+uWziNmnnm9Qb1a2aa50Tkhd5Z5a3mKlmtR1a+1BIS48rlmz10WFh3XQVvQHDXsZFQ0fB/tG13kZqg2Q2La+CGiG8P182M3m8DcOIUfe4xUrJl9DVmfjw1O9OSzV4rjbru4KUbzgMtduoofx3t8Q5ZBY2RCV8Osw7zBiT0cGHWAE0D5UBbBOXO2NeLVvg1DuPyn2CzYkExkOI57MbM7qZ3gLrkA4QyOKrXrp3tkVI9WkVbifmy814BelMmTc54Kj3yB0nKjgRUMcaLEqoGruQp4/r510G6mc6A6Tl9NcuLER1ox8t4LidHXkrVfx2/BWoFNLB/lH6H8R+nKbS77LpbWR/RujSGkQ+Bjn6ZFworzjjtm8E20tfGGelGmpMW0SqtHxygOxaOcjIuY58STiwKR7dJ+Z2c7OqFXGhLYvt0fmZvWSAhkr5mFOGzNOBurqbba5hlUXcd+1AXPFN6vDWpgJwMnow6sJKV6Hq6a3pILo/4WgP9VzXkGY97kByDm5UnVQ97ij/PZdSfQPgizzIDm7IHL8hYJxa28MGsZO1qV4Jmuxn5U1K6BK7W3EF5KXtxsASxc5XHJHKSYwoVJxVXOCZ7cXTcarU2R2z3EFXyrU/nkdl5aSExYq95G3ivS626FdZWxZYGAwfv1RknWRZN17BL1cEzCdGrWo38U5fXzn+/8NKYbIZJJ/dRPgLj9NGriiRizbOe4+GedWiwRD7yA8axaIRmJu5x5TLj2dlIcwfq/hv/+y/3JmWfPCSeVz7QBhXPlhl9bPDDniT1vJ6ULmaiIELr94QCMUNvYp+1bXBOz3WpHxUlEd9ozsMUc2XcOV37hLn+BZXrR7R/KSLOfYkyIWKGMy9flPZHX+6BRUrFdOAthlaVDv24sgAMWvvRcpTiODxcw0Tw0D45GY5xEjpktRFc1fCPlThxcQ6refTYPTj0Fi9m5vYYap42MZCn/Q4ZRK6lfevKytsedhu0rrHrLF7sQVMhIyfml82j6DEFXiD4u1iMX6WhY9qfBf3LmJNNpZPEy1WiNhoDZMRQVs4PGenuSrOMzenpF05ydaTE04TNi5XRW7t/PlO9ZGcr+LgVg21Oo3PrUgMLGLGEDcxKj1xuX0WCoHWB4W6PJbpyw3q8mkcwS4gXIYuJppXEG//lBLaG+OCzUSRsI4RezF5xihxscD1M0FJmxFcyfBZOyFSyb7xexpJLWBin5NzHanTztD8SI7yLbKGcS/4SNIvKpVfo0DB2JM67R/UNW0ZWMeRighJTyicafNEaciVJnTwm5zfD7M7fk5atICglTdWqN93m6MmvybAkVv0Ps8BvdfxtNZYsK/VVkYyYKjYIEuSumga2efJ7z2nyY8pehcVy5jZFt8drF7tuUH4haccdx182GAdwoMM/9VcPAAQgbteXvDm5swMf9430RV4CwMe/dQA+fxUN/4v+P01vRgUAtMDIVfnFgW5lIWlq/T/3dUR+CVjh/ITxFMCNi0RtlYAA3XoVCPENBWpUO62pNQRUIwGIZ2AfhLjF/CCMi8NBRFJcXI/aBTEJSfwaOJdUAFLZteilszo1anVlEiJIiGD+u+MimOSxyWRl4jXRFTnaRYxAjhq8tKtYN+UCVLBr0jQa9dSix06Zt9qqSrNcZZhRb35Mchp9fZMSVbqo0ll3VSqZZLBrjgkFKDRpVpt4PhnntwWeeGpvmrcqfxU/am0q9cykbGA6wdasks2EegLbpfJH0A6CVFo1nqtRFaHIumFXP1MVsz1Ztwx2y66zLtXJVGeX6oFGw8j5y7u7CPS6zrvyTfUjJNJ8VFJ7N00dNbudNyrTGTUew6Iq7lSd57dqEixAuFBBWsTOVGH27XbllqRFKqrmzHeF7c3+4/1LCJaoFAvxsSvIcb0RHQdiFEB//xkA8pdDX1JqywHxg7qaIfaCM1vAgs/mgUew5SIIAwAAAA=='
  const B = '#1d4f91', G = '#1b7a3e', R = '#c0282d', STICK = '#13702f', STICK_RED = '#c62828'
  const NUM = '一二三四五六七八九'
  const KAI = "MJKai,'Kaiti SC','STKaiti','KaiTi',serif"

  const dot = (x, y, r, c) => `<circle cx="${x}" cy="${y}" r="${r * 0.9}" fill="#fff" stroke="${c}" stroke-width="${r * 0.2}"/>`
    + `<circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="none" stroke="${c}" stroke-width="${r * 0.18}"/>`
    + `<circle cx="${x}" cy="${y}" r="${r * 0.24}" fill="${c}"/>`

  const DOTS = {
    2: [[30, 20, G], [30, 54, B]].map(d => [...d, 11]),
    3: [[16, 15, B], [30, 37, R], [44, 59, G]].map(d => [...d, 9]),
    4: [[18, 20, B], [42, 20, G], [18, 54, G], [42, 54, B]].map(d => [...d, 10]),
    5: [[17, 16, B], [43, 16, G], [30, 37, R], [17, 58, G], [43, 58, B]].map(d => [...d, 8.6]),
    6: [[19, 14, G], [41, 14, G], [19, 40, R], [41, 40, R], [19, 60, R], [41, 60, R]].map(d => [...d, 8.2]),
    7: [[14, 11, G], [30, 19, G], [46, 27, G], [19, 45, R], [41, 45, R], [19, 62, R], [41, 62, R]].map(d => [...d, 7]),
    8: [12, 29, 46, 63].flatMap(y => [[19, y, B, 7.6], [41, y, B, 7.6]]),
    9: [[15, B], [37, R], [59, G]].flatMap(([y, c]) => [14, 30, 46].map(x => [x, y, c, 7.4])),
  }
  const ONE_DOT = `<circle cx="30" cy="37" r="22" fill="#fff" stroke="${G}" stroke-width="2.6"/>`
    + Array.from({ length: 12 }, (_, i) => `<circle cx="${(30 + 16 * Math.cos(i * Math.PI / 6)).toFixed(2)}" cy="${(37 + 16 * Math.sin(i * Math.PI / 6)).toFixed(2)}" r="3" fill="${i % 2 ? R : B}"/>`).join('')
    + `<circle cx="30" cy="37" r="10" fill="${R}"/><circle cx="30" cy="37" r="6.5" fill="#fff"/><circle cx="30" cy="37" r="3.5" fill="${G}"/>`

  function stick(x, y, len, red = false, rot = 0) {
    const h = len / 2, w = 8.2, col = red ? STICK_RED : STICK
    const n = Math.max(4, Math.round(len / 6)), r = w / 2 + 1.2
    const bumps = Array.from({ length: n }, (_, i) => -h + r + (i * (len - 2 * r)) / (n - 1))
    return `<g transform="translate(${x} ${y}) rotate(${rot})"><rect x="${-w / 2}" y="${-h}" width="${w}" height="${len}" rx="${w / 2}" fill="${col}"/>`
      + bumps.map(by => `<circle cx="0" cy="${by.toFixed(2)}" r="${r}" fill="${col}"/>`).join('')
      + `<rect x="-1.3" y="${-h + 3}" width="2.6" height="${len - 6}" rx="1.3" fill="#fff"/></g>`
  }

  const TILT = (Math.atan2(12, 22) * 180) / Math.PI
  const BAMS = {
    2: [[30, 22], [30, 54]].map(s => [...s, 25]),
    3: [[30, 22], [17, 54], [43, 54]].map(s => [...s, 25]),
    4: [[19, 22], [41, 22], [19, 54], [41, 54]].map(s => [...s, 25]),
    5: [[15, 22, 25], [45, 22, 25], [30, 38, 25, true], [15, 54, 25], [45, 54, 25]],
    6: [22, 54].flatMap(y => [17, 30, 43].map(x => [x, y, 25])),
    7: [[30, 13, 17, true]].concat([38, 60].flatMap(y => [17, 30, 43].map(x => [x, y, 18]))),
    8: [[11, 22, 28], [49, 22, 28], [24, 23, 25, false, TILT], [36, 23, 25, false, -TILT],
      [11, 56, 28], [49, 56, 28], [24, 56, 25, false, -TILT], [36, 56, 25, false, TILT]],
    9: [13, 38, 63].flatMap(y => [[16, y, 19], [30, y, 19, true], [44, y, 19]]),
  }

  const BIRD = `<g stroke="#0d4a24" stroke-width=".7" stroke-linejoin="round">
<path d="M27 50 Q14 58 8 70 Q18 64 24 62 Q16 70 15 74 Q24 67 29 58 Z" fill="#2f9e58"/>
<path d="M28 52 Q22 64 24 75 Q29 66 32 56 Z" fill="${B}"/>
<path d="M30 30 Q44 32 42 46 Q40 56 28 56 Q20 54 21 44 Q22 34 30 30 Z" fill="#24a050"/>
<path d="M24 40 Q32 38 38 46 Q32 52 25 50 Q22 46 24 40 Z" fill="#7cc576"/>
<path d="M26 44 q2 3 4 1 M30 46 q2 3 4 1 M34 48 q2 3 4 1" fill="none"/>
<path d="M30 30 Q28 22 33 17 Q40 14 42 20 Q43 26 37 30 Z" fill="#24a050"/>
<path d="M34 16 Q31 9 34 6 Q35 11 37 12 Q38 7 41 6 Q40 12 38 16 Z" fill="${R}"/>
<path d="M42 20 L49 22 L42 24 Z" fill="#e8a31b"/></g>
<circle cx="38.5" cy="20" r="2" fill="#fff"/><circle cx="39" cy="20" r="1" fill="#111"/>
<path d="M29 56 L27 63 M34 55 L35 63" stroke="#c96b1a" stroke-width="1.6" stroke-linecap="round"/>
<path d="M18 64 L44 64" stroke="#8a5a2b" stroke-width="2.2" stroke-linecap="round"/>`

  const FACES = []
  for (let t = 0; t < 27; t++) {
    const s = Math.floor(t / 9), n = t % 9 + 1
    FACES[t] = s === 0
      ? `<text x="30" y="31" text-anchor="middle" font-size="25" fill="#1a2a5a" font-family="${KAI}">${NUM[n - 1]}</text><text x="30" y="66" text-anchor="middle" font-size="32" fill="${R}" font-family="${KAI}" stroke="${R}" stroke-width=".8">萬</text>`
      : s === 2
        ? n === 1 ? ONE_DOT : DOTS[n].map(([x, y, c, r]) => dot(x, y, r, c)).join('')
        : n === 1 ? BIRD : BAMS[n].map(([x, y, l, red, rot]) => stick(x, y, l, red, rot)).join('')
  }

  const svg = (w, body, cls = '') => `<svg class="${cls}" viewBox="0 0 60 84" width="${w}" height="${(w * 1.4).toFixed(1)}">${body}</svg>`

  const face = (t, w = 40, cls = 'tile') => svg(w, `<rect y="4" width="60" height="80" rx="5" fill="#1b2f86"/><rect width="60" height="80" rx="5" fill="#fff" stroke="#c8c8c8" stroke-width="1.2"/><g transform="translate(0 3)">${FACES[t]}</g>`, cls)
  const back = (w = 20, cls = 'tile back') => svg(w, '<rect width="60" height="84" rx="5" fill="#f4f4f4" stroke="#c8c8c8"/><rect width="60" height="68" rx="5" fill="url(#mjBack)"/>', cls)
  const flatBack = (w = 40, cls = 'tile') => svg(w, '<rect y="4" width="60" height="80" rx="5" fill="#16287a"/><rect width="60" height="80" rx="5" fill="url(#mjBack)"/>', cls)
  const side = () => '<div class="side-tile"></div>'

  const PIPS = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }
  const die = (n, w = 28) => `<svg class="die" viewBox="0 0 40 40" width="${w}" height="${w}"><rect x="1" y="3" width="38" height="36" rx="8" fill="#bbb"/><rect x="1" y="1" width="38" height="36" rx="8" fill="#fdfdf8"/>`
    + PIPS[n].map(([x, y]) => `<circle cx="${x * 10}" cy="${y * 9.5 - 0.5}" r="${n === 1 || n === 4 ? 4.2 : 3.6}" fill="${n === 1 || n === 4 ? R : '#222'}"/>`).join('') + '</svg>'

  const defs = () => `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><linearGradient id="mjBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d4bb8"/><stop offset="1" stop-color="#16287a"/></linearGradient></defs></svg>`
    + `<style>@font-face{font-family:MJKai;src:url(${FONT}) format("woff2");font-display:block}</style>`

  const name = t => NUM[t % 9] + ['萬', '条', '筒'][Math.floor(t / 9)]

  return { face, back, flatBack, side, die, defs, name }
})()

globalThis.MJTiles = MJTiles
