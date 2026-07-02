import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LEVEL_CURVE,
  levelForXp,
  levelProgress,
  xpForLevel,
} from './gamification'

describe('level curve', () => {
  const c = DEFAULT_LEVEL_CURVE

  it('level 1 needs 0 xp', () => {
    expect(xpForLevel(1, c)).toBe(0)
    expect(levelForXp(0, c)).toBe(1)
    expect(levelForXp(-50, c)).toBe(1)
  })

  it('thresholds are monotonically increasing', () => {
    let prev = -1
    for (let l = 1; l <= 20; l++) {
      const t = xpForLevel(l, c)
      expect(t).toBeGreaterThan(prev)
      prev = t
    }
  })

  it('levelForXp matches thresholds', () => {
    const l3 = xpForLevel(3, c)
    expect(levelForXp(l3, c)).toBe(3)
    expect(levelForXp(l3 - 1, c)).toBe(2)
    expect(levelForXp(l3 + 1, c)).toBe(3)
  })

  it('progress ratio is within 0..1 and points at the right level', () => {
    const xp = xpForLevel(4, c) + 5
    const p = levelProgress(xp, c)
    expect(p.level).toBe(4)
    expect(p.ratio).toBeGreaterThanOrEqual(0)
    expect(p.ratio).toBeLessThanOrEqual(1)
    expect(p.intoLevel).toBe(5)
  })
})
