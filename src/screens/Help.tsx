import { useSession, isParent } from '../store/session'

interface HelpCard {
  icon: string
  title: string
  body: string
}

const CARDS: HelpCard[] = [
  {
    icon: '🏠',
    title: 'Start your day here',
    body: 'Tap "Today" to see what you need to do. Do them from top to bottom!',
  },
  {
    icon: '✅',
    title: 'Tick things off',
    body: 'Tap a chore or task to mark it done. It turns green with a checkmark. Tap again if you made a mistake.',
  },
  {
    icon: '🌅',
    title: 'Routines',
    body: 'Tap a routine (like Morning or Bedtime) to open it. Check off each step, then press Finish to get your stars!',
  },
  {
    icon: '⭐',
    title: 'Stars & points',
    body: 'Every task you finish gives you stars. Save them up to spend in the Reward Store.',
  },
  {
    icon: '📈',
    title: 'Level up',
    body: 'Stars also make your level go up. The bar at the top fills as you get closer to the next level.',
  },
  {
    icon: '🔥',
    title: 'Streaks',
    body: 'Do something every day to build a streak. The number next to the 🔥 is how many days in a row you have kept going!',
  },
  {
    icon: '🏅',
    title: 'Badges',
    body: 'Reach special goals to earn cool badges. Try to collect them all!',
  },
  {
    icon: '🎁',
    title: 'Reward Store',
    body: 'Tap "Rewards" to swap your stars for treats and fun. A grown-up may need to say yes first.',
  },
  {
    icon: '🏁',
    title: 'Quests',
    body: 'Quests are big challenges. Fill up the bar before time runs out to win a bonus!',
  },
  {
    icon: '🙋',
    title: 'Need help?',
    body: 'Stuck or not sure? Ask Mom or Dad — they can change anything in Settings.',
  },
]

export function Help() {
  const profile = useSession((s) => s.activeProfile)
  const parent = isParent(profile)

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="text-5xl">🗺️</div>
        <h1 className="mt-1 text-2xl font-bold">How to play</h1>
        <p className="text-slate-500 dark:text-slate-400">
          Finish tasks, earn stars, and have fun!
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {CARDS.map((c) => (
          <div key={c.title} className="card flex items-start gap-3">
            <span className="text-4xl leading-none">{c.icon}</span>
            <div>
              <h2 className="text-lg font-bold">{c.title}</h2>
              <p className="text-slate-600 dark:text-slate-300">{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {parent && (
        <div className="card bg-brand-50 dark:bg-brand-900/40">
          <h2 className="font-bold">For grown-ups 👋</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Everything is editable in <strong>Settings</strong> — profiles, routines,
            chores, schedule, holiday mode, rewards, point values and challenges.
            Pending chore approvals and reward requests appear under
            <strong> Settings → Approvals</strong>. Back up your data regularly from
            <strong> Settings → Data</strong>.
          </p>
        </div>
      )}
    </div>
  )
}
