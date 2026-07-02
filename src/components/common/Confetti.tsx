import { useEffect, useState } from 'react'
import { useUI } from '../../store/ui'

const COLORS = ['#f97316', '#4f46e5', '#0ea5e9', '#22c55e', '#eab308', '#ec4899']

interface Piece {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  size: number
}

/** Lightweight CSS-only confetti burst, triggered by ui.confettiAt changes. */
export function Confetti() {
  const confettiAt = useUI((s) => s.confettiAt)
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    if (!confettiAt) return
    const next: Piece[] = Array.from({ length: 80 }, (_, i) => ({
      id: confettiAt + i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 1.6 + Math.random() * 1.2,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
    }))
    setPieces(next)
    const t = setTimeout(() => setPieces([]), 3200)
    return () => clearTimeout(t)
  }, [confettiAt])

  if (pieces.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-sm animate-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
