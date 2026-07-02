import { create } from 'zustand'
import type { Badge } from '../domain/types'

export interface Toast {
  id: number
  message: string
  emoji?: string
}

interface Celebration {
  points: number
  leveledUp: boolean
  newLevel: number
  badges: Badge[]
}

interface UIState {
  toasts: Toast[]
  confettiAt: number // timestamp; bump to trigger a burst
  celebration: Celebration | null
  pushToast: (message: string, emoji?: string) => void
  dismissToast: (id: number) => void
  celebrate: (c: Celebration) => void
  clearCelebration: () => void
}

let toastSeq = 1

export const useUI = create<UIState>((set) => ({
  toasts: [],
  confettiAt: 0,
  celebration: null,
  pushToast: (message, emoji) => {
    const id = toastSeq++
    set((s) => ({ toasts: [...s.toasts, { id, message, emoji }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 2600)
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  celebrate: (c) =>
    set({ celebration: c, confettiAt: Date.now() }),
  clearCelebration: () => set({ celebration: null }),
}))
