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

  const GANG_NOTE = { mingGang: '明杠', anGang: '暗杠', buGang: '补杠' }

  const payGang = (type, kongSeat, activeSeats) =>
    activeSeats.filter(s => s !== kongSeat).map(s => ({ kind: 'gang', from: s, to: kongSeat, amount: type === 'anGang' ? 2 : 1, note: GANG_NOTE[type] }))

  const payHu = (winner, discarder, base, activeSeats) =>
    discarder != null
      ? [{ kind: 'hu', from: discarder, to: winner, amount: base, note: '点炮' }]
      : activeSeats.filter(s => s !== winner).map(s => ({ kind: 'zimo', from: s, to: winner, amount: base, note: '自摸' }))

  function transferGang(gangEntries, winner) {
    if (!gangEntries.length) return []
    const amount = gangEntries.reduce((a, e) => a + e.amount, 0)
    return [{ kind: 'transfer', from: gangEntries[0].to, to: winner, amount, note: '呼叫转移' }]
  }

  const isHuazhu = p => p.hand.some(t => suitOf(t) === p.que) || p.melds.some(m => suitOf(m.tile) === p.que)

  function maxWaitFan(p, cap) {
    let best = -1
    for (const t of waits(p.hand, p.que)) best = Math.max(best, scoreHand({ hand: p.hand, melds: p.melds, winTile: t }, cap).cappedFan)
    return best
  }

  function settleDraw(players, cap) {
    const out = []
    const active = players.map((p, s) => s).filter(s => !players[s].won)
    const pigs = active.filter(s => isHuazhu(players[s]))
    const clean = active.filter(s => !pigs.includes(s))
    const pigAmount = 2 ** (cap ?? 4)
    for (const pig of pigs) for (const s of clean) out.push({ kind: 'huazhu', from: pig, to: s, amount: pigAmount, note: '查花猪' })
    const fans = new Map(clean.map(s => [s, maxWaitFan(players[s], cap)]))
    for (const loser of clean.filter(s => fans.get(s) < 0))
      for (const s of clean.filter(s => fans.get(s) >= 0)) out.push({ kind: 'dajiao', from: loser, to: s, amount: 2 ** fans.get(s), note: '查大叫' })
    return out
  }

  const WALL_STACKS = [14, 13, 14, 13]
  const SEATS = [0, 1, 2, 3]
  const byNum = (a, b) => a - b
  const newPlayer = total => ({ hand: [], melds: [], discards: [], que: null, exchangeOut: null, won: null, skipHuUntilDraw: false, total, dealerRoll: null })
  const activeSeats = st => SEATS.filter(s => !st.players[s].won)
  const removeTiles = (arr, t, n = 1) => { for (let i = 0; i < n; i++) arr.splice(arr.indexOf(t), 1) }
  const ledgerSum = (es, s) => es.reduce((a, e) => a + (e.to === s ? e.amount : 0) - (e.from === s ? e.amount : 0), 0)

  function newMatch({ seed, cap = 3 }) {
    return {
      rng: seed >>> 0, cap, round: 0, dealer: 0, nextDealer: null, phase: 'dealerRoll', rollers: [...SEATS], turn: null,
      wall: [], dice: null, breakAt: null, exchangeDir: null, players: SEATS.map(() => newPlayer(0)),
      drawn: null, afterGang: false, lastDiscard: null, claim: null, gangFlag: null, ledger: [], events: [], winOrder: [],
    }
  }

  function startRound(st) {
    const wall = []
    for (let t = 0; t < 27; t++) wall.push(t, t, t, t)
    for (let i = wall.length - 1; i > 0; i--) {
      const j = Math.floor(rngNext(st) * (i + 1))
      ;[wall[i], wall[j]] = [wall[j], wall[i]]
    }
    Object.assign(st, {
      wall, phase: 'break', turn: st.dealer, dice: null, breakAt: null, exchangeDir: null, players: st.players.map(p => newPlayer(p.total)),
      drawn: null, afterGang: false, lastDiscard: null, claim: null, gangFlag: null, ledger: [], winOrder: [], nextDealer: null,
    })
  }

  function nextRound(st) {
    const s = structuredClone(st)
    s.round++
    s.dealer = s.nextDealer ?? s.dealer
    s.events = []
    startRound(s)
    return s
  }

  function roll(st, seat, kind, n) {
    const values = Array.from({ length: n }, () => rollDie(st))
    st.dice = { kind, seat, values }
    st.events.push({ type: 'roll', kind, seat, values })
    return values
  }

  function draw(st, s) {
    const t = st.wall.shift()
    const p = st.players[s]
    p.hand.push(t)
    p.hand.sort(byNum)
    p.skipHuUntilDraw = false
    Object.assign(st, { drawn: t, afterGang: false, turn: s, phase: 'play' })
    st.events.push({ type: 'draw', seat: s, tile: t })
  }

  function endRound(st) {
    st.ledger.push(...settleDraw(st.players, st.cap))
    for (const s of SEATS) st.players[s].total += ledgerSum(st.ledger, s)
    Object.assign(st, { phase: 'ended', turn: null, drawn: null, claim: null })
    st.events.push({ type: 'ended' })
  }

  function advanceFrom(st, s) {
    if (st.winOrder.length >= 3 || !st.wall.length) return endRound(st)
    let n = (s + 1) % 4
    while (st.players[n].won) n = (n + 1) % 4
    draw(st, n)
  }

  function recordWin(st, s, tile, from, score) {
    if (!st.winOrder.length && st.nextDealer == null) st.nextDealer = s
    st.players[s].won = { order: st.winOrder.length + 1, tile, selfDrawn: from == null, from, score }
    st.winOrder.push(s)
    st.events.push({ type: 'hu', seat: s, tile, from, selfDrawn: from == null })
  }

  function doGang(st, s, type, tile) {
    const start = st.ledger.length
    st.ledger.push(...payGang(type, s, activeSeats(st)))
    st.gangFlag = { seat: s, ledgerIdx: SEATS.slice(0, st.ledger.length - start).map(i => start + i) }
    st.events.push({ type: 'gang', seat: s, tile, kind: type })
    const t = st.wall.pop()
    st.players[s].hand.push(t)
    st.players[s].hand.sort(byNum)
    st.players[s].skipHuUntilDraw = false
    Object.assign(st, { drawn: t, afterGang: true, turn: s, phase: 'play' })
    st.events.push({ type: 'draw', seat: s, tile: t, replacement: true })
  }

  function completeBuGang(st, s, t) {
    const p = st.players[s]
    removeTiles(p.hand, t)
    p.melds.find(m => m.type === 'peng' && m.tile === t).type = 'buGang'
    doGang(st, s, 'buGang', t)
  }

  const queClean = p => !hasSuit(p.hand, p.que)
  const canHuOn = (p, t) => !p.won && !p.skipHuUntilDraw && suitOf(t) !== p.que && queClean(p) && isWin(counts(p.hand.concat([t])))

  function openClaim(st, from, t, kind) {
    const options = claimOptions(st, from, t, kind)
    if (Object.keys(options).length) {
      st.claim = { kind, tile: t, from, options, responses: {} }
      st.phase = 'claim'
    } else if (kind === 'qiangGang') completeBuGang(st, from, t)
    else {
      st.gangFlag = null
      advanceFrom(st, from)
    }
  }

  function claimOptions(st, from, t, kind) {
    const options = {}
    for (let i = 1; i < 4; i++) {
      const s = (from + i) % 4
      const p = st.players[s]
      if (p.won) continue
      const opts = []
      if (canHuOn(p, t)) opts.push({ type: 'hu' })
      if (kind === 'discard' && suitOf(t) !== p.que) {
        const n = p.hand.filter(x => x === t).length
        if (n >= 3 && st.wall.length) opts.push({ type: 'gang' })
        if (n >= 2) opts.push({ type: 'peng' })
      }
      if (opts.length) options[s] = [...opts, { type: 'pass' }]
    }
    return options
  }

  function resolveClaim(st) {
    const { kind, tile: t, from, responses } = st.claim
    const order = [1, 2, 3].map(i => (from + i) % 4).filter(s => s in responses)
    const huers = order.filter(s => responses[s].type === 'hu')
    st.claim = null
    if (huers.length) {
      if (!st.winOrder.length && huers.length > 1) st.nextDealer = from
      if (kind === 'discard') st.players[from].discards.pop()
      else removeTiles(st.players[from].hand, t)
      const pao = kind === 'discard' && st.gangFlag?.seat === from
      const active = activeSeats(st)
      for (const h of huers) {
        const p = st.players[h]
        const score = scoreHand({ hand: p.hand, melds: p.melds, winTile: t, flags: { gangShangPao: pao, qiangGang: kind === 'qiangGang' } }, st.cap)
        recordWin(st, h, t, from, score)
        st.ledger.push(...payHu(h, from, score.base, active))
      }
      if (pao) st.ledger.push(...transferGang(st.gangFlag.ledgerIdx.map(i => st.ledger[i]), huers[0]))
      st.gangFlag = null
      return advanceFrom(st, huers.at(-1))
    }
    const taker = order.find(s => responses[s].type === 'gang') ?? order.find(s => responses[s].type === 'peng')
    if (taker == null) {
      if (kind === 'qiangGang') return completeBuGang(st, from, t)
      st.gangFlag = null
      return advanceFrom(st, from)
    }
    const p = st.players[taker]
    const type = responses[taker].type === 'gang' ? 'mingGang' : 'peng'
    st.players[from].discards.pop()
    removeTiles(p.hand, t, type === 'peng' ? 2 : 3)
    p.melds.push({ type, tile: t, from })
    st.gangFlag = null
    if (type === 'mingGang') return doGang(st, taker, 'mingGang', t)
    Object.assign(st, { turn: taker, phase: 'play', drawn: null, afterGang: false })
    st.events.push({ type: 'peng', seat: taker, tile: t, from })
  }

  function exchangeOptions(hand) {
    const seen = new Set()
    const out = []
    for (let i = 0; i < hand.length; i++)
      for (let j = i + 1; j < hand.length; j++)
        for (let k = j + 1; k < hand.length; k++) {
          const tiles = [hand[i], hand[j], hand[k]]
          if (suitOf(tiles[0]) !== suitOf(tiles[1]) || suitOf(tiles[0]) !== suitOf(tiles[2])) continue
          const key = tiles.join()
          if (!seen.has(key)) seen.add(key), out.push({ type: 'exchange', tiles })
        }
    return out
  }

  function pendingSeats(st) {
    switch (st.phase) {
      case 'dealerRoll': return st.rollers.filter(s => st.players[s].dealerRoll == null)
      case 'break': case 'exchangeRoll': return [st.dealer]
      case 'exchange': return SEATS.filter(s => !st.players[s].exchangeOut)
      case 'que': return SEATS.filter(s => st.players[s].que == null)
      case 'play': return [st.turn]
      case 'claim': return Object.keys(st.claim.options).map(Number).filter(s => !(s in st.claim.responses))
      default: return []
    }
  }

  function legalActions(st, seat) {
    if (!pendingSeats(st).includes(seat)) return []
    const p = st.players[seat]
    switch (st.phase) {
      case 'dealerRoll': case 'break': case 'exchangeRoll': return [{ type: 'roll' }]
      case 'exchange': return exchangeOptions(p.hand)
      case 'que': return [0, 1, 2].map(suit => ({ type: 'que', suit }))
      case 'claim': return st.claim.options[seat]
    }
    const acts = []
    const clean = queClean(p)
    if (st.drawn != null && clean && isWin(counts(p.hand))) acts.push({ type: 'hu' })
    if (st.wall.length) {
      const c = counts(p.hand)
      for (let t = 0; t < 27; t++) if (c[t] === 4 && suitOf(t) !== p.que) acts.push({ type: 'anGang', tile: t })
      for (const m of p.melds) if (m.type === 'peng' && c[m.tile]) acts.push({ type: 'buGang', tile: m.tile })
    }
    for (const t of [...new Set(p.hand)]) if (clean || suitOf(t) === p.que) acts.push({ type: 'discard', tile: t })
    return acts
  }

  const sameAction = (a, b) => a.type === b.type && (a.tile ?? null) === (b.tile ?? null) && (a.suit ?? null) === (b.suit ?? null)
    && String(a.tiles?.slice().sort(byNum) ?? '') === String(b.tiles?.slice().sort(byNum) ?? '')

  function apply(state, seat, action) {
    if (!legalActions(state, seat).some(a => sameAction(a, action))) throw new Error(`非法动作 ${JSON.stringify(action)} @${state.phase}/${seat}`)
    const st = structuredClone(state)
    step(st, seat, action)
    return st
  }

  function step(st, seat, action) {
    const p = st.players[seat]
    switch (st.phase) {
      case 'dealerRoll': {
        const [a, b] = roll(st, seat, 'dealer', 2)
        p.dealerRoll = a + b
        if (pendingSeats(st).length) break
        const max = Math.max(...st.rollers.map(s => st.players[s].dealerRoll))
        const top = st.rollers.filter(s => st.players[s].dealerRoll === max)
        if (top.length > 1) {
          st.rollers = top
          for (const s of top) st.players[s].dealerRoll = null
        } else {
          st.dealer = top[0]
          st.rollers = []
          startRound(st)
        }
        break
      }
      case 'break': {
        const [a, b] = roll(st, seat, 'break', 2)
        const wallSeat = (st.dealer + a + b - 1) % 4
        st.breakAt = { wallSeat, stack: Math.min(a + b, WALL_STACKS[wallSeat]) }
        for (let i = 0; i < 4; i++) {
          const s = (st.dealer + i) % 4
          st.players[s].hand = st.wall.splice(0, s === st.dealer ? 14 : 13).sort(byNum)
        }
        st.events.push({ type: 'deal' })
        st.phase = 'exchange'
        break
      }
      case 'exchange':
        for (const t of action.tiles) removeTiles(p.hand, t)
        p.exchangeOut = action.tiles.slice().sort(byNum)
        st.events.push({ type: 'exchangeSelect', seat })
        if (!pendingSeats(st).length) st.phase = 'exchangeRoll'
        break
      case 'exchangeRoll': {
        const [d] = roll(st, seat, 'exchange', 1)
        const off = d <= 2 ? 3 : d <= 4 ? 2 : 1
        for (const s of SEATS) st.players[(s + off) % 4].hand.push(...st.players[s].exchangeOut)
        for (const q of st.players) q.hand.sort(byNum)
        st.exchangeDir = off
        st.events.push({ type: 'exchange', dir: off })
        st.phase = 'que'
        break
      }
      case 'que':
        p.que = action.suit
        st.events.push({ type: 'queSelect', seat })
        if (!pendingSeats(st).length) {
          st.events.push({ type: 'que', ques: st.players.map(q => q.que) })
          Object.assign(st, { phase: 'play', turn: st.dealer, drawn: st.players[st.dealer].hand.at(-1) })
        }
        break
      case 'claim':
        st.claim.responses[seat] = action
        if (action.type === 'pass' && st.claim.options[seat].some(a => a.type === 'hu')) p.skipHuUntilDraw = true
        if (!pendingSeats(st).length) resolveClaim(st)
        break
      case 'play':
        if (action.type === 'discard') {
          removeTiles(p.hand, action.tile)
          p.discards.push(action.tile)
          Object.assign(st, { lastDiscard: { seat, tile: action.tile }, drawn: null, afterGang: false })
          st.events.push({ type: 'discard', seat, tile: action.tile })
          openClaim(st, seat, action.tile, 'discard')
        } else if (action.type === 'anGang') {
          removeTiles(p.hand, action.tile, 4)
          p.melds.push({ type: 'anGang', tile: action.tile, from: null })
          doGang(st, seat, 'anGang', action.tile)
        } else if (action.type === 'buGang') {
          st.drawn = null
          openClaim(st, seat, action.tile, 'qiangGang')
        } else {
          const t = st.drawn
          const rest = p.hand.slice()
          removeTiles(rest, t)
          const score = scoreHand({ hand: rest, melds: p.melds, winTile: t, selfDrawn: true, flags: { gangShangHua: st.afterGang, haidi: !st.wall.length } }, st.cap)
          p.hand = rest
          const active = activeSeats(st)
          recordWin(st, seat, t, null, score)
          st.ledger.push(...payHu(seat, null, score.base, active))
          st.gangFlag = null
          advanceFrom(st, seat)
        }
        break
    }
  }

  function view(st, seat) {
    const v = structuredClone(st)
    delete v.rng
    v.wallCount = v.wall.length
    delete v.wall
    v.players.forEach((p, s) => {
      p.handCount = p.hand.length
      if (s === seat) return
      delete p.skipHuUntilDraw
      if (v.phase !== 'ended') for (const m of p.melds) if (m.type === 'anGang') m.tile = null
      if (!p.won && v.phase !== 'ended') p.hand = null
      p.exchangeOut = null
      if (v.phase === 'que') p.que = null
    })
    if (v.turn !== seat) v.drawn = null
    if (v.claim) {
      v.claim.options = seat in v.claim.options ? { [seat]: v.claim.options[seat] } : {}
      v.claim.responses = seat in v.claim.responses ? { [seat]: v.claim.responses[seat] } : {}
    }
    const hidden = e => e.seat !== seat && v.phase !== 'ended' && (e.type === 'draw' || (e.type === 'gang' && e.kind === 'anGang'))
    v.events = v.events.map(e => (hidden(e) ? { ...e, tile: null } : e))
    return v
  }

  return {
    SUITS, suitOf, rankOf, parse, counts, rngNext, rollDie, decompose, isWin, waits, shanten, scoreHand,
    payGang, payHu, transferGang, isHuazhu, settleDraw, ledgerSum,
    newMatch, nextRound, pendingSeats, legalActions, apply, step, view, claimOptions,
  }
})()

globalThis.MJ = MJ
