import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

interface DropdownMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  danger?: boolean
}

export function DropdownMenu({ items }: { items: DropdownMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        aria-label="More options"
        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onClick()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                item.danger
                  ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
