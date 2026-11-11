const MJAI = (() => {
  const { suitOf, counts, shanten } = MJ

  const mkRng = seed => {
    const st = { rng: seed >>> 0 }
    return () => MJ.rngNext(st)
  }

  function visibleCounts(view) {
    const c = new Array(27).fill(0)
    for (const p of view.players) {
      for (const t of p.hand ?? []) c[t]++
      for (const t of p.discards) c[t]++
      for (const m of p.melds) c[m.tile] += m.type === 'peng' ? 3 : 4
      if (p.won) c[p.won.tile]++
    }
    return c
  }

  function ownCounts(p) {
    const c = counts(p.hand)
    for (const m of p.melds) c[m.tile] += m.type === 'peng' ? 3 : 4
    return c
  }

  const sameSuit = (a, b) => suitOf(a) === suitOf(b)

  function connectivity(t, c) {
    let v = (c[t] - 1) * 3
    for (const d of [-2, -1, 1, 2]) {
      const x = t + d
      if (x >= 0 && x < 27 && sameSuit(t, x)) v += c[x] * (Math.abs(d) === 1 ? 2 : 1)
    }
    return v
  }

  function ukeire(hand, que, remain) {
    const base = shanten(hand)
    const c = counts(hand)
    let total = 0
    for (let x = 0; x < 27; x++) {
      if (suitOf(x) === que || remain[x] <= 0) continue
      let near = c[x] > 0
      for (const d of [-2, -1, 1, 2]) if (!near && x + d >= 0 && x + d < 27 && sameSuit(x, x + d) && c[x + d]) near = true
      if (!near) continue
      hand.push(x)
      if (shanten(hand) < base) total += remain[x]
      hand.pop()
    }
    return total
  }

  function threats(view, seat) {
    const out = []
    view.players.forEach((p, s) => {
      if (s === seat || p.won || p.melds.length < 2) return
      const suits = new Set(p.melds.map(m => suitOf(m.tile)))
      out.push({ strong: p.melds.length >= 3 || suits.size === 1, suits: suits.size === 1 ? suits : new Set([0, 1, 2].filter(x => x !== p.que)), safe: new Set(p.discards) })
    })
    return out
  }

  function rankDiscards(view, seat, tiles, level, rnd) {
    const p = view.players[seat]
    const c = counts(p.hand)
    if (level === 'easy' || tiles.some(t => suitOf(t) === p.que))
      return tiles.map(t => ({ t, score: -connectivity(t, c) - rnd() * 0.5 })).sort((a, b) => b.score - a.score).map(x => x.t)
    const remain = level === 'hard' ? visibleCounts(view).map(n => 4 - n) : ownCounts(p).map(n => 4 - n)
    const danger = level === 'hard' ? threats(view, seat) : []
    const suitCount = [0, 0, 0]
    for (const t of p.hand) suitCount[suitOf(t)]++
    for (const m of p.melds) suitCount[suitOf(m.tile)] += 3
    const main = suitCount.indexOf(Math.max(...suitCount))
    const ranked = []
    for (const t of tiles) {
      const h = p.hand.slice()
      h.splice(h.indexOf(t), 1)
      const s = shanten(h)
      let score = -s * 10000 - connectivity(t, c)
      if (level === 'hard' && s === 0) {
        for (const x of MJ.waits(h, p.que)) score += Math.max(0, remain[x]) * 2 ** MJ.scoreHand({ hand: h, melds: p.melds, winTile: x }, view.cap).cappedFan * 10
      } else score += ukeire(h, p.que, remain) * 10
      if (level === 'hard') {
        if (suitCount[main] >= 9 && suitOf(t) !== main) score += 200
        if (s >= 2) for (const th of danger) if (th.strong && th.suits.has(suitOf(t)) && !th.safe.has(t)) score -= 60
      }
      ranked.push({ t, score })
    }
    return ranked.sort((a, b) => b.score - a.score).map(x => x.t)
  }

  function chooseExchange(p, level, rnd) {
    const bySuit = [0, 1, 2].map(s => p.hand.filter(t => suitOf(t) === s))
    const ok = [0, 1, 2].filter(s => bySuit[s].length >= 3)
    const suit = level === 'easy' ? ok[Math.floor(rnd() * ok.length)] : ok.sort((a, b) => bySuit[a].length - bySuit[b].length)[0]
    const c = counts(p.hand)
    const tiles = bySuit[suit].slice().sort((a, b) => connectivity(a, c) - connectivity(b, c)).slice(0, 3)
    return { type: 'exchange', tiles }
  }

  function chooseQue(p) {
    const c = counts(p.hand)
    const score = s => p.hand.filter(t => suitOf(t) === s).reduce((a, t) => a + 10 + connectivity(t, c), 0)
    return { type: 'que', suit: [0, 1, 2].sort((a, b) => score(a) - score(b))[0] }
  }

  function pengHelps(p, t) {
    const clean = p.hand.filter(x => suitOf(x) !== p.que)
    const before = shanten(clean)
    const h = clean.slice()
    h.splice(h.indexOf(t), 1)
    h.splice(h.indexOf(t), 1)
    let after = Infinity
    for (const d of new Set(h)) {
      const hh = h.slice()
      hh.splice(hh.indexOf(d), 1)
      after = Math.min(after, shanten(hh))
    }
    return after <= before
  }

  function determinize(view, seat, rnd) {
    const st = structuredClone(view)
    const seen = visibleCounts(view)
    const pool = []
    for (let t = 0; t < 27; t++) for (let k = seen[t]; k < 4; k++) pool.push(t)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    st.players.forEach((p, s) => {
      if (p.hand) return
      const hand = []
      for (let pass = 0; hand.length < p.handCount; pass++)
        for (let i = 0; i < pool.length && hand.length < p.handCount; i++)
          if (pass > 0 || suitOf(pool[i]) !== p.que || rnd() < 0.25) hand.push(pool.splice(i--, 1)[0])
      p.hand = hand.sort((a, b) => a - b)
    })
    st.wall = pool
    st.rng = Math.floor(rnd() * 4294967296)
    st.events = []
    if (st.claim) {
      st.claim.options = MJ.claimOptions(st, st.claim.from, st.claim.tile, st.claim.kind)
      st.claim.responses = {}
    }
    return st
  }

  function fastAction(st, s, rnd) {
    const acts = MJ.legalActions(st, s)
    if (acts.length === 1) return acts[0]
    const pick = type => acts.find(a => a.type === type)
    const take = pick('hu') ?? pick('gang') ?? pick('peng') ?? pick('anGang') ?? pick('buGang')
    if (take) return take
    const c = counts(st.players[s].hand)
    let best = null, bv = Infinity
    for (const a of acts) {
      const v = connectivity(a.tile, c) + rnd()
      if (v < bv) best = a, bv = v
    }
    return best
  }

  function rollout(st, seat, rnd) {
    for (let n = 0; st.phase !== 'ended' && n < 500; n++) {
      const s = MJ.pendingSeats(st)[0]
      MJ.step(st, s, fastAction(st, s, rnd))
    }
    return MJ.ledgerSum(st.ledger, seat)
  }

  function chooseMaster(view, seat, actions, seed, timeMs) {
    const rnd = mkRng(seed)
    if (view.phase !== 'play' && view.phase !== 'claim') return choose(view, seat, actions, 'hard', seed)
    const hu = actions.find(a => a.type === 'hu')
    if (hu) return hu
    const tiles = actions.filter(a => a.type === 'discard').map(a => a.tile)
    const prior = choose(view, seat, actions, 'hard', seed)
    const cands = [prior, ...actions.filter(a => a.type !== 'discard' && a !== prior)]
    if (tiles.length) for (const tile of rankDiscards(view, seat, tiles, 'hard', rnd).slice(0, 4)) if (prior.tile !== tile || prior.type !== 'discard') cands.push({ type: 'discard', tile })
    if (cands.length === 1) return cands[0]
    const sums = cands.map(() => 0)
    const sq = cands.map(() => 0)
    const deadline = Date.now() + timeMs
    let n = 0
    while (Date.now() < deadline || n < 8) {
      const world = determinize(view, seat, rnd)
      const rs = Math.floor(rnd() * 4294967296)
      const base = []
      cands.forEach((a, i) => {
        const st = structuredClone(world)
        MJ.step(st, seat, a)
        const v = rollout(st, seat, mkRng(rs))
        if (i === 0) base.push(v)
        const d = v - (i === 0 ? v : base[0])
        sums[i] += d
        sq[i] += d * d
      })
      n++
    }
    let best = 0
    for (let i = 1; i < cands.length; i++) {
      const mean = sums[i] / n
      const se = Math.sqrt(Math.max(0, sq[i] / n - mean * mean) / n)
      if (mean > 2 * se && mean > sums[best] / n) best = i
    }
    return cands[best]
  }

  function choose(view, seat, actions, level, seed, opts = {}) {
    if (actions.length === 1) return actions[0]
    if (level === 'master') return chooseMaster(view, seat, actions, seed, opts.timeMs ?? 1500)
    const rnd = mkRng(seed)
    const p = view.players[seat]
    const find = type => actions.find(a => a.type === type)
    if (view.phase === 'exchange') return chooseExchange(p, level, rnd)
    if (view.phase === 'que') return chooseQue(p)
    if (find('hu')) return find('hu')
    if (view.phase === 'claim') {
      if (find('gang')) return find('gang')
      if (find('peng') && (level !== 'hard' || pengHelps(p, view.claim.tile))) return find('peng')
      return find('pass')
    }
    const gang = find('anGang') ?? find('buGang')
    if (gang) return gang
    const tiles = actions.filter(a => a.type === 'discard').map(a => a.tile)
    return { type: 'discard', tile: rankDiscards(view, seat, tiles, level, rnd)[0] }
  }

  return { choose, visibleCounts, ukeire, connectivity }
})()

globalThis.MJAI = MJAI
