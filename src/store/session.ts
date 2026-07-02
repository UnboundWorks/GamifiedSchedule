import { create } from 'zustand'
import type { Profile } from '../domain/types'

interface SessionState {
  activeProfile: Profile | null
  unlocked: boolean
  lastActivity: number
  signIn: (profile: Profile) => void
  signOut: () => void
  refreshProfile: (profile: Profile) => void
  touch: () => void
}

/**
 * Ephemeral session state only. The source of truth for domain data is Dexie;
 * this just tracks who is currently using the shared iPad. Deliberately NOT
 * persisted — closing the app returns to the profile picker.
 */
export const useSession = create<SessionState>((set, get) => ({
  activeProfile: null,
  unlocked: false,
  lastActivity: Date.now(),
  signIn: (profile) =>
    set({ activeProfile: profile, unlocked: true, lastActivity: Date.now() }),
  signOut: () => set({ activeProfile: null, unlocked: false }),
  refreshProfile: (profile) => {
    if (get().activeProfile?.id === profile.id) set({ activeProfile: profile })
  },
  touch: () => set({ lastActivity: Date.now() }),
}))

export const isParent = (p: Profile | null): boolean => p?.role === 'parent'
