import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface AddableSelectOption {
  value: string
  label: string
}

const buttonBase =
  'flex w-full items-center justify-between gap-2 rounded-md border border-transparent bg-transparent px-2 py-1 text-left text-sm hover:bg-slate-50 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500'

export function AddableSelectCell({
  value,
  options,
  onCommit,
  placeholder = '— Chọn —',
  addLabel,
  addPlaceholder,
  onAdd,
  addDisabled,
  addDisabledMessage,
}: {
  value: string | null | ''
  options: AddableSelectOption[]
  onCommit: (value: string) => void | Promise<void>
  placeholder?: string
  addLabel: string
  addPlaceholder: string
  onAdd: (name: string) => Promise<AddableSelectOption>
  addDisabled?: boolean
  addDisabledMessage?: string
}) {
  const anchorRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [position, setPosition] = useState({ left: 0, top: 0, width: 240 })

  const current = options.find((option) => option.value === value)

  function updatePosition() {
    const rect = anchorRef.current?.getBoundingClientRect()
    if (!rect) return
    const width = Math.max(rect.width, 240)
    const estimatedHeight = 360
    const preferredTop = rect.bottom + 4
    const top = preferredTop + estimatedHeight > window.innerHeight
      ? Math.max(8, rect.top - estimatedHeight - 4)
      : preferredTop
    const left = Math.min(Math.max(8, rect.left), Math.max(8, window.innerWidth - width - 8))
    setPosition({ left, top, width })
  }

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
      setAdding(false)
      setError('')
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        setAdding(false)
        setError('')
      }
    }

    function handleViewportChange() {
      updatePosition()
    }

    document.addEventListener('mousedown', handleOutside)
    document.addEventListener('keydown', handleKey)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('mousedown', handleOutside)
      document.removeEventListener('keydown', handleKey)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [open])

  useEffect(() => {
    if (adding) window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [adding])

  async function choose(nextValue: string) {
    await onCommit(nextValue)
    setOpen(false)
    setAdding(false)
    setError('')
  }

  async function createOption() {
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError('')
    try {
      const created = await onAdd(trimmed)
      await onCommit(created.value)
      setName('')
      setAdding(false)
      setOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thêm lựa chọn')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        className={buttonBase}
        onClick={() => {
          setOpen((previous) => !previous)
          setError('')
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={current ? 'truncate text-slate-800' : 'truncate text-slate-500'}>
          {current?.label ?? (value || placeholder)}
        </span>
        <span className="shrink-0 text-[10px] text-slate-500">▼</span>
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
          style={{ left: position.left, top: position.top, width: position.width }}
        >
          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {placeholder && (
              <button
                type="button"
                className="flex w-full items-center px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
                onClick={() => choose('')}
              >
                {placeholder}
              </button>
            )}
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={
                  'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50 ' +
                  (option.value === value ? 'bg-emerald-50 font-medium text-emerald-800' : 'text-slate-700')
                }
                onClick={() => choose(option.value)}
                role="option"
                aria-selected={option.value === value}
              >
                <span className="truncate">{option.label}</span>
                {option.value === value && <span className="text-emerald-600">✓</span>}
              </button>
            ))}
            {options.length === 0 && (
              <div className="px-3 py-3 text-sm text-slate-400">Chưa có lựa chọn nào.</div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-2">
            {!adding ? (
              <button
                type="button"
                disabled={addDisabled}
                title={addDisabled ? addDisabledMessage : undefined}
                onClick={() => {
                  if (!addDisabled) setAdding(true)
                }}
                className="flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-emerald-300 bg-white px-3 py-2 text-sm font-medium text-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
              >
                <span className="text-base leading-none">+</span>
                {addDisabled ? (addDisabledMessage ?? addLabel) : addLabel}
              </button>
            ) : (
              <div className="space-y-2">
                <input
                  ref={inputRef}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') createOption()
                    if (event.key === 'Escape') {
                      setAdding(false)
                      setName('')
                      setError('')
                    }
                  }}
                  placeholder={addPlaceholder}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {error && <div className="text-xs text-red-600">{error}</div>}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAdding(false)
                      setName('')
                      setError('')
                    }}
                    className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={!name.trim() || saving}
                    onClick={createOption}
                    className="rounded-md bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-40"
                  >
                    {saving ? 'Đang thêm...' : 'Thêm và chọn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
