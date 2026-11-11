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
