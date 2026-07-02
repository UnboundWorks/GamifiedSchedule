import { toggleCompletion } from '../repositories/completions.repo'
import type { Profile, Settings, TaskInstance } from '../domain/types'
import { useUI } from '../store/ui'

/**
 * Toggle a task instance and surface gamified feedback (toast, confetti,
 * level-up / badge celebration). Central place so every screen behaves alike.
 */
export async function completeInstance(
  profile: Profile,
  instance: TaskInstance,
  settings: Settings,
): Promise<void> {
  const ui = useUI.getState()
  const res = await toggleCompletion(profile, instance, settings)

  if (res.undone) {
    ui.pushToast('Marked not done', '↩️')
    return
  }

  if (res.pointsAwarded > 0) {
    ui.pushToast(`+${res.pointsAwarded} points`, '⭐')
    ui.celebrate({
      points: res.pointsAwarded,
      leveledUp: res.leveledUp,
      newLevel: res.newLevel,
      badges: res.newBadges,
    })
  } else if (instance.requiresApproval) {
    ui.pushToast('Sent for parent approval', '⏳')
  }
}
