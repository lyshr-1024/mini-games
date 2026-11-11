const MJ = (() => {
  const SUITS = 'wtb'
  const suitOf = t => Math.floor(t / 9)
  const rankOf = t => t % 9 + 1

  function parse(str) {
    const out = []
    for (const m of str.matchAll(/(\d+)([wtb])/g)) for (const d of m[1]) out.push(SUITS.indexOf(m[2]) * 9 + Number(d) - 1)
    return out
  }

  function counts(tiles) {
    const c = new Array(27).fill(0)
    for (const t of tiles) c[t]++
    return c
  }

  function rngNext(state) {
    let a = (state.rng = (state.rng + 0x6d2b79f5) >>> 0)
    a = Math.imul(a ^ (a >>> 15), a | 1)
    a ^= a + Math.imul(a ^ (a >>> 7), a | 61)
    return ((a ^ (a >>> 14)) >>> 0) / 4294967296
  }
  const rollDie = state => 1 + Math.floor(rngNext(state) * 6)

  function setsOnly(c, i, sets, out) {
    while (i < 27 && c[i] === 0) i++
    if (i === 27) return out.push(sets.slice()), true
    let found = false
    if (c[i] >= 3) {
      c[i] -= 3; sets.push({ kind: 'pung', tile: i })
      found = setsOnly(c, i, sets, out) || found
      sets.pop(); c[i] += 3
    }
    if (rankOf(i) <= 7 && c[i + 1] && c[i + 2]) {
      c[i]--; c[i + 1]--; c[i + 2]--; sets.push({ kind: 'chow', tile: i })
      found = setsOnly(c, i, sets, out) || found
      sets.pop(); c[i]++; c[i + 1]++; c[i + 2]++
    }
    return found
  }

  function decompose(c) {
    const total = c.reduce((a, b) => a + b, 0)
    if (total % 3 !== 2) return []
    const res = []
    const cc = c.slice()
    for (let p = 0; p < 27; p++) {
      if (cc[p] < 2) continue
      cc[p] -= 2
      const out = []
      setsOnly(cc, 0, [], out)
      for (const sets of out) res.push({ pair: p, sets })
      cc[p] += 2
    }
    return res
  }

  const isSevenPairs = c => c.reduce((a, b) => a + b, 0) === 14 && c.every(n => n % 2 === 0)
  const isWin = c => isSevenPairs(c) || decompose(c).length > 0

  const hasSuit = (tiles, s) => tiles.some(t => suitOf(t) === s)

  function waits(hand, que) {
    if (que != null && hasSuit(hand, que)) return []
    const c = counts(hand)
    const out = []
    for (let t = 0; t < 27; t++) {
      if (suitOf(t) === que || c[t] >= 4) continue
      c[t]++
      if (isWin(c)) out.push(t)
      c[t]--
    }
    return out
  }

  function standardShanten(c, need) {
    let best = 2 * need
    const search = (i, m, t, p) => {
      while (i < 27 && c[i] === 0) i++
      if (i === 27) {
        const v = 2 * need - 2 * m - Math.min(t, need - m) - p
        if (v < best) best = v
        return
      }
      const r = rankOf(i)
      if (m < need && c[i] >= 3) { c[i] -= 3; search(i, m + 1, t, p); c[i] += 3 }
      if (m < need && r <= 7 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; search(i, m + 1, t, p); c[i]++; c[i + 1]++; c[i + 2]++ }
      if (c[i] >= 2) {
        if (!p) { c[i] -= 2; search(i, m, t, 1); c[i] += 2 }
        c[i] -= 2; search(i, m, t + 1, p); c[i] += 2
      }
      if (r <= 8 && c[i + 1]) { c[i]--; c[i + 1]--; search(i, m, t + 1, p); c[i]++; c[i + 1]++ }
      if (r <= 7 && c[i + 2]) { c[i]--; c[i + 2]--; search(i, m, t + 1, p); c[i]++; c[i + 2]++ }
      c[i]--; search(i, m, t, p); c[i]++
    }
    search(0, 0, 0, 0)
    return best
  }

  function shanten(hand) {
    const c = counts(hand)
    const n = hand.length
    let s = standardShanten(c, Math.floor(n / 3))
    if (n >= 13) s = Math.min(s, 6 - c.reduce((a, x) => a + (x >> 1), 0))
    return s
  }

  const meldTiles = m => new Array(m.type === 'peng' ? 3 : 4).fill(m.tile)
  const isYaoJiu = r => r === 1 || r === 9
  const BONUS = [['selfDrawn', '自摸'], ['gangShangHua', '杠上花'], ['gangShangPao', '杠上炮'], ['qiangGang', '抢杠胡'], ['haidi', '海底捞月']]

  function scoreHand({ hand, melds = [], winTile, selfDrawn = false, flags = {} }, cap) {
    const c = counts(hand.concat([winTile]))
    const all = counts(hand.concat([winTile], ...melds.map(meldTiles)))
    const suits = new Set(all.flatMap((n, t) => (n ? [suitOf(t)] : [])))
    const roots = all.filter(n => n === 4).length
    const common = []
    if (suits.size === 1) common.push({ name: '清一色', fan: 2 })
    if (roots) common.push({ name: '根', fan: roots })
    for (const [k, name] of BONUS) if (k === 'selfDrawn' ? selfDrawn : flags[k]) common.push({ name, fan: 1 })

    const shapes = []
    if (!melds.length && isSevenPairs(c)) shapes.push([{ name: '七对', fan: 2 }])
    for (const d of decompose(c)) {
      const sets = d.sets.concat(melds.map(m => ({ kind: 'pung', tile: m.tile })))
      const items = []
      if (sets.every(s => s.kind === 'pung')) {
        const jiang = [d.pair, ...sets.map(s => s.tile)].every(t => [2, 5, 8].includes(rankOf(t)))
        items.push(jiang ? { name: '将对', fan: 3 } : { name: '对对胡', fan: 1 })
        if (hand.length === 1) items.push({ name: '金钩钓', fan: 1 })
      }
      const setHasYao = s => (s.kind === 'pung' ? isYaoJiu(rankOf(s.tile)) : rankOf(s.tile) === 1 || rankOf(s.tile) === 7)
      if (isYaoJiu(rankOf(d.pair)) && sets.every(setHasYao)) items.push({ name: '带幺九', fan: 2 })
      shapes.push(items)
    }

    let best = null
    for (const shape of shapes) {
      const items = shape.concat(common)
      if (!shape.length && suits.size > 1) items.unshift({ name: '平胡', fan: 0 })
      const fan = items.reduce((a, i) => a + i.fan, 0)
      if (!best || fan > best.fan) best = { fan, items }
    }
    const cappedFan = cap == null ? best.fan : Math.min(best.fan, cap)
    return { fan: best.fan, cappedFan, base: 2 ** cappedFan, items: best.items }
  }

  return { SUITS, suitOf, rankOf, parse, counts, rngNext, rollDie, decompose, isWin, waits, shanten, scoreHand }
})()

globalThis.MJ = MJ
