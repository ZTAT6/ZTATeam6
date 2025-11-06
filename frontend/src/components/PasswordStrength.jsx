import React from 'react'

export function scorePassword(pw) {
  const len = pw?.length || 0
  let score = 0
  if (len >= 8) score++
  if (/[a-z]/.test(pw)) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  // penalize obvious sequences
  if (/^(1234|abcd|password|qwerty)/i.test(pw)) score = Math.max(score - 2, 0)
  const levels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong']
  const level = levels[Math.min(score, levels.length - 1)]
  const pct = Math.min(100, Math.max(0, Math.round((score / 5) * 100)))
  return { score, level, pct }
}

export default function PasswordStrength({ password }) {
  const { level, pct } = scorePassword(password || '')
  const color = pct < 40 ? '#b3261e' : pct < 60 ? '#f59e0b' : pct < 80 ? '#0c61cf' : '#0e6de6'
  return (
    <div className="strength-wrap">
      <div className="strength-track">
        <div className="strength-bar" style={{ width: `${pct}%`, background: color }}></div>
      </div>
      <div className="strength-label">{level}</div>
    </div>
  )
}