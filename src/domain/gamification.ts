import type { LevelCurve } from './types'

export const DEFAULT_LEVEL_CURVE: LevelCurve = { base: 100, factor: 1.5 }

/**
 * Total cumulative XP required to REACH a given level (level 1 = 0 XP).
 * xpForLevel(n) = base * (n-1)^factor, rounded. Monotonically increasing.
 */
export function xpForLevel(level: number, curve: LevelCurve): number {
  if (level <= 1) return 0
  return Math.round(curve.base * Math.pow(level - 1, curve.factor))
}

/** The level a given amount of lifetime XP corresponds to (min level 1). */
export function levelForXp(xp: number, curve: LevelCurve): number {
  if (xp <= 0) return 1
  let level = 1
  // Bounded loop — levels grow super-linearly so this terminates quickly.
  while (xpForLevel(level + 1, curve) <= xp && level < 999) {
    level += 1
  }
  return level
}

export interface LevelProgress {
  level: number
  currentLevelXp: number // xp needed to have reached current level
  nextLevelXp: number // xp needed to reach next level
  intoLevel: number // xp accumulated within the current level
  span: number // xp span of the current level
  ratio: number // 0..1 progress toward next level
}

export function levelProgress(xp: number, curve: LevelCurve): LevelProgress {
  const level = levelForXp(xp, curve)
  const currentLevelXp = xpForLevel(level, curve)
  const nextLevelXp = xpForLevel(level + 1, curve)
  const span = Math.max(1, nextLevelXp - currentLevelXp)
  const intoLevel = Math.max(0, xp - currentLevelXp)
  return {
    level,
    currentLevelXp,
    nextLevelXp,
    intoLevel,
    span,
    ratio: Math.min(1, intoLevel / span),
  }
}
