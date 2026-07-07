import { useEffect, useRef, useState } from 'react'

const inputBase =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 hover:bg-slate-50'

export function TextCell({
  value,
  onCommit,
  placeholder,
  required,
}: {
  value: string
  onCommit: (v: string) => void
  placeholder?: string
  required?: boolean
}) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <input
      className={inputBase + (required && !local.trim() ? ' ring-1 ring-rose-300' : '')}
      value={local}
      placeholder={placeholder}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local)
      }}
    />
  )
}

export function TextAreaCell({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  return (
    <textarea
      className={inputBase + ' resize-none'}
      rows={1}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        if (local !== value) onCommit(local)
      }}
    />
  )
}

function isValidUrl(v: string) {
  if (!v) return true
  try {
    new URL(v)
    return true
  } catch {
    return false
  }
}

export function UrlCell({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [local, setLocal] = useState(value)
  useEffect(() => setLocal(value), [value])
  const valid = isValidUrl(local)
  return (
    <div className="flex items-center gap-1">
      <input
        className={inputBase + (valid ? '' : ' ring-1 ring-rose-300')}
        value={local}
        placeholder="https://..."
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value && isValidUrl(local)) onCommit(local)
        }}
      />
      {value && valid && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          title="Mở link trong tab mới"
          className="shrink-0 rounded px-1.5 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
        >
          Mở
        </a>
      )}
    </div>
  )
}

type SelectOption<T extends string> = T | { value: T; label: string }

export function SelectCell<T extends string>({
  value,
  options,
  onCommit,
  placeholder,
}: {
  value: T | null | ''
  options: readonly SelectOption<T>[] | SelectOption<T>[]
  onCommit: (v: T) => void
  placeholder?: string
}) {
  return (
    <select
      className={inputBase + ' cursor-pointer'}
      value={value ?? ''}
      onChange={(e) => onCommit(e.target.value as T)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const normalized = typeof option === 'string'
          ? { value: option, label: option }
          : option

        return (
          <option key={normalized.value} value={normalized.value}>
            {normalized.label}
          </option>
        )
      })}
    </select>
  )
}

export function useDebouncedCommit<T>(commitFn: (v: T) => void, delay = 500) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  return (v: T) => {
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => commitFn(v), delay)
  }
}
