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
