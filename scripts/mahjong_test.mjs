import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const load = f => vm.runInThisContext(readFileSync(join(root, 'web', 'mahjong', f), 'utf8'), { filename: f })
load('engine.js')
const { MJ } = globalThis

test('isWin 标准型/七对/非胡', () => {
  assert.ok(MJ.isWin(MJ.counts(MJ.parse('123w 456w 789w 111t 55t'))))
  assert.ok(MJ.isWin(MJ.counts(MJ.parse('11w 22w 33w 44t 55t 66b 66b'))))
  assert.ok(!MJ.isWin(MJ.counts(MJ.parse('123w 456w 789w 111t 56t'))))
})

test('waits', () => {
  assert.deepEqual(MJ.waits(MJ.parse('123w 456w 789w 11t 55t'), 2), MJ.parse('1t 5t'))
  assert.deepEqual(MJ.waits(MJ.parse('1112345678999w'), 1), MJ.parse('123456789w'))
  assert.deepEqual(MJ.waits(MJ.parse('123w 456w 789w 11t 55b'), 2), [])
})

test('shanten', () => {
  assert.equal(MJ.shanten(MJ.parse('123w 456w 789w 11t 55t')), 0)
  assert.equal(MJ.shanten(MJ.parse('11w 22w 33w 44t 55t 66b 7b')), 0)
  assert.equal(MJ.shanten(MJ.parse('123w 456w 789w 1t 5t 9t 2b')), 2)
  assert.equal(MJ.shanten(MJ.parse('123w 456w 789w 111t 55t')), -1)
})

test('rng 可复现', () => {
  const a = { rng: 42 }, b = { rng: 42 }
  const ra = [1, 2, 3, 4].map(() => MJ.rollDie(a)), rb = [1, 2, 3, 4].map(() => MJ.rollDie(b))
  assert.deepEqual(ra, rb)
  assert.ok(ra.every(n => n >= 1 && n <= 6))
})

const S = (o, cap = 3) => MJ.scoreHand({ melds: [], selfDrawn: false, flags: {}, ...o, hand: MJ.parse(o.hand), winTile: MJ.parse(o.win)[0] }, cap)
const peng = t => ({ type: 'peng', tile: MJ.parse(t)[0], from: 1 })

test('番型：牌型', () => {
  assert.equal(S({ hand: '123w 456w 789w 234t 5t', win: '5t' }).fan, 0)
  assert.deepEqual(S({ hand: '123w 456w 789w 234t 5t', win: '5t' }).items.map(i => i.name), ['平胡'])
  assert.equal(S({ hand: '111w 555w 999w 111t 5t', win: '5t' }).fan, 1)
  assert.equal(S({ hand: '123w 345w 678w 999w 5w', win: '5w' }).fan, 2)
  assert.equal(S({ hand: '11w 22w 33w 44t 55t 66t 7t', win: '7t' }).fan, 2)
  assert.equal(S({ hand: '11w 22w 33w 44t 55t 55t 7t', win: '7t' }).fan, 3)
  assert.equal(S({ hand: '123w 789w 111t 789t 9t', win: '9t' }).fan, 2)
  assert.equal(S({ hand: '222w 555w 888t 222t 5t', win: '5t' }).fan, 3)
  assert.equal(S({ hand: '3w', win: '3w', melds: ['1w', '4w', '6t', '7t'].map(peng) }).fan, 2)
  assert.equal(S({ hand: '5t', win: '5t', melds: ['2w', '5w', '8t', '2t'].map(peng) }, null).fan, 4)
})

test('番型：加番', () => {
  const base = { hand: '123w 456w 789w 234t 5t', win: '5t' }
  assert.equal(S({ ...base, selfDrawn: true, flags: { gangShangHua: true } }).fan, 2)
  assert.equal(S({ ...base, selfDrawn: true, flags: { haidi: true } }).fan, 2)
  assert.equal(S({ ...base, flags: { gangShangPao: true } }).fan, 1)
  assert.equal(S({ ...base, flags: { qiangGang: true } }).fan, 1)
})

test('番型：封顶', () => {
  const o = { hand: '111w 555w 999w 3w', win: '3w', selfDrawn: true, melds: [{ type: 'anGang', tile: MJ.parse('2w')[0], from: null }] }
  const r = S(o)
  assert.equal(r.fan, 5)
  assert.equal(r.cappedFan, 3)
  assert.equal(r.base, 8)
  const u = S(o, null)
  assert.equal(u.cappedFan, 5)
  assert.equal(u.base, 32)
})

const sum = (es, s) => es.reduce((a, e) => a + (e.to === s ? e.amount : 0) - (e.from === s ? e.amount : 0), 0)

test('杠钱', () => {
  const a = MJ.payGang('anGang', 0, [0, 1, 2, 3])
  assert.equal(sum(a, 0), 6)
  assert.equal(sum(a, 1), -2)
  const m = MJ.payGang('mingGang', 0, [0, 1, 3])
  assert.equal(sum(m, 0), 2)
  assert.equal(sum(m, 2), 0)
  assert.equal(sum(MJ.payGang('buGang', 2, [0, 1, 2, 3]), 2), 3)
})

test('点炮/自摸/一炮多响', () => {
  assert.equal(sum(MJ.payHu(1, 0, 8, [0, 1, 2, 3]), 0), -8)
  const z = MJ.payHu(1, null, 4, [0, 1, 3])
  assert.equal(sum(z, 1), 8)
  assert.equal(sum(z, 2), 0)
  const multi = [...MJ.payHu(1, 0, 2, [0, 1, 2, 3]), ...MJ.payHu(2, 0, 4, [0, 1, 2, 3])]
  assert.equal(sum(multi, 0), -6)
})

test('呼叫转移', () => {
  const g = MJ.payGang('anGang', 0, [0, 1, 2, 3])
  const t = MJ.transferGang(g, 2)
  assert.equal(t[0].kind, 'transfer')
  assert.equal(sum([...g, ...t], 0), 0)
  assert.equal(sum([...g, ...t], 2), 4)
})

test('查花猪/查大叫', () => {
  const P = (hand, que, melds = []) => ({ hand: MJ.parse(hand), que, melds, won: null })
  const players = [
    P('123w 456w 789w 11t 55t', 2),
    P('123w 456w 789w 11t 55b', 1),
    P('123w 456w 789w 147t 9t', 2),
    { ...P('111w', 2), won: { order: 1 } },
  ]
  const es = MJ.settleDraw(players, 3)
  assert.equal(sum(es, 1), -16)
  assert.equal(sum(es, 2), 7)
  assert.equal(sum(es, 0), 9)
  assert.equal(sum(es, 3), 0)
  assert.equal(sum(MJ.settleDraw(players, null), 1), -32)
})

test('查大叫按听牌最大番', () => {
  const P = (hand, que) => ({ hand: MJ.parse(hand), que, melds: [], won: null })
  const players = [P('1112345678999w', 2), P('123w 456w 789w 147t 9t', 2), P('123w 456w 789w 147t 9t', 2), { ...P('1w', 2), won: { order: 1 } }]
  assert.equal(sum(MJ.settleDraw(players, null), 0), 2 * 2 ** 3)
})

const T = s => MJ.parse(s)[0]
function setup(st, { hands, wall = '', turn = 0, que = [2, 2, 2, 2], melds = [[], [], [], []] }) {
  st.phase = 'play'
  st.dealer = 0
  st.turn = turn
  st.wall = MJ.parse(wall)
  st.claim = null
  st.gangFlag = null
  st.afterGang = false
  st.players.forEach((p, s) => {
    p.hand = MJ.parse(hands[s])
    p.que = que[s]
    p.melds = melds[s]
  })
  st.drawn = st.players[turn].hand.at(-1)
  return st
}
const act = (st, seat, a) => MJ.apply(st, seat, a)
const fresh = () => MJ.newMatch({ seed: 7, cap: 3 })
const DUO = ['111w 222w 333w 444w 9t 5t', '555w 666w 777w 34t 99t', '888w 999w 55t 66t 77t 8t', '11t 234t 67t 123b 456b']
const DUO_QUE = [2, 2, 2, 0]

test('一炮多响：两家都胡，碰作废，点炮者付两笔', () => {
  let st = setup(fresh(), { hands: DUO, que: DUO_QUE, wall: '9b 9b 9b' })
  st = act(st, 0, { type: 'discard', tile: T('5t') })
  assert.equal(st.phase, 'claim')
  assert.deepEqual(MJ.pendingSeats(st).sort(), [1, 2, 3])
  st = act(st, 1, { type: 'hu' })
  st = act(st, 2, { type: 'peng' })
  st = act(st, 3, { type: 'hu' })
  assert.ok(st.players[1].won && st.players[3].won)
  assert.equal(st.players[2].melds.length, 0)
  assert.deepEqual(st.winOrder, [1, 3])
  assert.equal(sum(st.ledger, 0), -2)
  assert.equal(st.nextDealer, 0)
  assert.equal(st.turn, 0)
  assert.equal(st.phase, 'play')
  assert.ok(!MJ.pendingSeats(st).includes(1) && !MJ.pendingSeats(st).includes(3))
})

test('有胡选过后另一家碰成功，过手胡生效', () => {
  let st = setup(fresh(), { hands: DUO, que: DUO_QUE, wall: '9b 9b 9b' })
  st = act(st, 0, { type: 'discard', tile: T('5t') })
  st = act(st, 1, { type: 'pass' })
  st = act(st, 3, { type: 'pass' })
  st = act(st, 2, { type: 'peng' })
  assert.equal(st.players[2].melds[0].type, 'peng')
  assert.equal(st.turn, 2)
  assert.ok(st.players[1].skipHuUntilDraw && st.players[3].skipHuUntilDraw)
  assert.ok(MJ.legalActions(st, 2).every(a => a.type !== 'hu'))
})

test('单家点炮胡：首胡者为下一局庄家', () => {
  let st = setup(fresh(), { hands: DUO, que: DUO_QUE, wall: '9b 9b 9b' })
  st = act(st, 0, { type: 'discard', tile: T('5t') })
  st = act(st, 1, { type: 'hu' })
  st = act(st, 2, { type: 'pass' })
  st = act(st, 3, { type: 'pass' })
  assert.equal(st.nextDealer, 1)
  assert.equal(st.turn, 2)
})

test('牌墙空时不能杠碰，流局并连庄', () => {
  let st = setup(fresh(), { hands: ['1111w 222w 333w 44w 6t', '555t 666w 777w 34t 99t', '888w 999w 66t 77t 8t 2t', '11t 234t 67t 123b 456b'], que: [2, 2, 2, 0] })
  assert.ok(MJ.legalActions(st, 0).every(a => !['anGang', 'buGang'].includes(a.type)))
  st = act(st, 0, { type: 'discard', tile: T('6t') })
  assert.equal(st.phase, 'ended')
  assert.equal(MJ.nextRound(st).dealer, 0)
  assert.equal(MJ.nextRound(st).round, st.round + 1)
})

test('抢杠胡：补杠作废，无杠钱，胡家带抢杠胡', () => {
  let st = setup(fresh(), {
    hands: ['111w 222w 333w 4w 5t', DUO[1], '888w 999w 66t 77t 8t 1b 2b', DUO[3]],
    que: [2, 2, 1, 0], melds: [[{ type: 'peng', tile: T('5t'), from: 2 }], [], [], []], wall: '9b 9b',
  })
  st = act(st, 0, { type: 'buGang', tile: T('5t') })
  assert.equal(st.phase, 'claim')
  st = act(st, 1, { type: 'hu' })
  for (const s of MJ.pendingSeats(st)) st = act(st, s, { type: 'pass' })
  assert.ok(st.players[1].won.score.items.some(i => i.name === '抢杠胡'))
  assert.ok(st.ledger.every(e => e.kind !== 'gang'))
  assert.equal(st.players[0].melds[0].type, 'peng')
  assert.ok(!st.players[0].hand.includes(T('5t')))
})

test('杠上炮：杠钱呼叫转移给胡家', () => {
  let st = setup(fresh(), { hands: ['1111w 222w 333w 4w 5t 9t 6t', DUO[1], '888w 999w 66t 77t 8t 1b 2b', DUO[3]], que: [2, 2, 1, 0], wall: '9b 9b 7t' })
  st = act(st, 0, { type: 'anGang', tile: T('1w') })
  assert.equal(sum(st.ledger, 0), 6)
  assert.equal(st.drawn, T('7t'))
  st = act(st, 0, { type: 'discard', tile: T('5t') })
  st = act(st, 1, { type: 'hu' })
  for (const s of MJ.pendingSeats(st)) st = act(st, s, { type: 'pass' })
  assert.ok(st.players[1].won.score.items.some(i => i.name === '杠上炮'))
  const tr = st.ledger.find(e => e.kind === 'transfer')
  assert.equal(tr.amount, 6)
  assert.equal(tr.to, 1)
  assert.equal(sum(st.ledger, 0), 6 - 6 - 2)
})

test('有缺门牌时只能打缺门', () => {
  const st = setup(fresh(), { hands: ['111w 222w 333w 44w 5t 5b', DUO[1], DUO[2], DUO[3]], que: [2, 2, 2, 0] })
  const ds = MJ.legalActions(st, 0).filter(a => a.type === 'discard')
  assert.deepEqual(ds.map(a => a.tile), [T('5b')])
})

function playRandom(seed, onStep = st => st) {
  const pick = { rng: seed * 7919 }
  let st = MJ.newMatch({ seed, cap: 3 })
  for (let n = 0; n < 5000 && st.phase !== 'ended'; n++) {
    const seats = MJ.pendingSeats(st)
    assert.ok(seats.length > 0, `no pending seat in phase ${st.phase}`)
    for (const s of seats) assert.ok(!st.players[s].won, 'won seat pending')
    const s = seats[Math.floor(MJ.rngNext(pick) * seats.length)]
    const acts = MJ.legalActions(st, s)
    assert.ok(acts.length > 0)
    st = onStep(MJ.apply(st, s, acts[Math.floor(MJ.rngNext(pick) * acts.length)]))
  }
  assert.equal(st.phase, 'ended')
  return st
}

test('换三张方向与交换', () => {
  let st = MJ.newMatch({ seed: 3, cap: 3 })
  while (st.phase !== 'exchange') st = act(st, MJ.pendingSeats(st)[0], { type: 'roll' })
  const outs = []
  for (let s = 0; s < 4; s++) {
    const a = MJ.legalActions(st, s).find(x => x.type === 'exchange')
    assert.ok(a.tiles.every(t => MJ.suitOf(t) === MJ.suitOf(a.tiles[0])))
    outs.push(a.tiles)
    st = act(st, s, a)
  }
  const before = st.players.map(p => p.hand.length)
  st = act(st, st.dealer, { type: 'roll' })
  const die = st.dice.values[0]
  const off = die <= 2 ? 3 : die <= 4 ? 2 : 1
  assert.equal(st.exchangeDir, off)
  assert.equal(st.phase, 'que')
  for (let s = 0; s < 4; s++) {
    const to = (s + off) % 4
    assert.equal(st.players[to].hand.length, before[to] + 3)
    const c = MJ.counts(st.players[to].hand)
    for (const t of outs[s]) assert.ok(c[t]-- > 0)
  }
})

test('视图脱敏', () => {
  let st = MJ.newMatch({ seed: 5, cap: 3 })
  while (st.phase !== 'exchange') st = act(st, MJ.pendingSeats(st)[0], { type: 'roll' })
  const v = MJ.view(st, 1)
  assert.equal(v.wall, undefined)
  assert.equal(v.wallCount, st.wall.length)
  assert.equal(v.rng, undefined)
  assert.equal(v.players[0].hand, null)
  assert.equal(v.players[0].handCount, st.players[0].hand.length)
  assert.deepEqual(v.players[1].hand, st.players[1].hand)
})

test('随机整局：200 局打到结束，账本守恒', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const st = playRandom(seed)
    assert.equal([0, 1, 2, 3].reduce((a, s) => a + sum(st.ledger, s), 0), 0)
    assert.equal(st.players.reduce((a, p) => a + p.total, 0), 0)
    const nr = MJ.nextRound(st)
    assert.equal(nr.phase, 'break')
  }
})

test('JSON 往返不改变对局', () => {
  for (let seed = 1; seed <= 20; seed++) {
    const a = playRandom(seed)
    const b = playRandom(seed, st => JSON.parse(JSON.stringify(st)))
    assert.deepEqual(JSON.parse(JSON.stringify(a)), JSON.parse(JSON.stringify(b)))
  }
})
