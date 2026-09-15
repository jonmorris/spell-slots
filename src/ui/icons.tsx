interface IconProps {
  className?: string
}

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  )
}

export function OrbIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="13" r="7" />
      <path d="M12 2v2M4.6 5.6 6 7M19.4 5.6 18 7" />
    </svg>
  )
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M8 7h7M8 11h5" />
    </svg>
  )
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m12 3 2.4 5.4 5.6.6-4.2 3.9 1.2 5.6L12 15.7 6.99 18.5l1.2-5.6L4 9l5.6-.6z" />
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}
