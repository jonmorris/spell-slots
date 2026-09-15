import { useEffect, useRef, type ReactNode } from 'react'

interface SheetProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** A bottom sheet. Closes on backdrop click and on Escape, and traps initial focus. */
export function Sheet({ title, subtitle, onClose, children, footer }: SheetProps) {
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector<HTMLElement>('input, button, textarea')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose])

  return (
    <div className="scrim" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" ref={panel} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-grip" />
        <h2 className="sheet-title">{title}</h2>
        {subtitle ? <p className="sheet-sub">{subtitle}</p> : null}
        <div className="sheet-scroll">{children}</div>
        {footer}
      </div>
    </div>
  )
}
