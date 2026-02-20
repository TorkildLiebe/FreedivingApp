import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value?: string
  placeholder?: string
  onChange?: (value: string) => void
  onSubmit?: (value: string) => void
}

export function SearchBar({
  value: controlledValue,
  placeholder = 'Search dive spots...',
  onChange,
  onSubmit,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : internalValue

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    if (!isControlled) setInternalValue(v)
    onChange?.(v)
  }

  function handleClear() {
    if (!isControlled) setInternalValue('')
    onChange?.('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') onSubmit?.(value)
  }

  return (
    <div
      className="
        flex items-center gap-2
        bg-white/80 dark:bg-stone-900/85
        backdrop-blur-md
        rounded-2xl
        shadow-lg shadow-black/10
        border border-stone-200/60 dark:border-stone-700/60
        px-4 py-3
      "
    >
      <Search
        size={18}
        className="text-stone-400 dark:text-stone-500 shrink-0"
        aria-hidden="true"
      />
      <input
        type="search"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="
          flex-1 min-w-0
          bg-transparent
          text-stone-900 dark:text-stone-100
          placeholder:text-stone-400 dark:placeholder:text-stone-500
          text-sm font-[Inter,sans-serif]
          outline-none
          [-webkit-appearance:none]
          [&::-webkit-search-cancel-button]:hidden
        "
        aria-label="Search dive spots"
      />
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
