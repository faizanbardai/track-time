'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  isValidTimeZone,
  parseEventInput,
} from '@/helpers/datetime/eventTiming'
import { cn } from '@/lib/utils'

export const timeZoneLabel = (zone: string, date: string, time = '12:00') => {
  const city = zone.split('/').at(-1)!.replaceAll('_', ' ')
  try {
    const offset = parseEventInput(date, time || '12:00', zone).format('Z')
    return `${city} (UTC${offset})`
  } catch {
    return city
  }
}

interface TimeZonePickerProps {
  id: string
  value: string
  date: string
  time?: string
  onChange: (zone: string) => void
  onBlur?: () => void
}

export const TimeZonePicker = ({
  id,
  value,
  date,
  time,
  onChange,
  onBlur,
}: TimeZonePickerProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const deviceZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const zones = useMemo(() => {
    const supported =
      typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : []
    return [...new Set([deviceZone, value, 'UTC', ...supported])].filter(
      isValidTimeZone,
    )
  }, [deviceZone, value])
  const options = useMemo(() => {
    const search = query.trim().toLowerCase().replaceAll('_', ' ')
    return zones.filter((zone) =>
      zone.replaceAll('_', ' ').toLowerCase().includes(search),
    )
  }, [zones, query])

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView?.({ block: 'nearest' })
  }, [active])

  const select = (zone: string) => {
    onChange(zone)
    setOpen(false)
    setQuery('')
  }

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setOpen(false)
          setQuery('')
          onBlur?.()
        }
      }}
    >
      <Input
        id={id}
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={`${id}-options`}
        aria-activedescendant={
          open && options[active] ? `${id}-option-${active}` : undefined
        }
        value={open ? query : timeZoneLabel(value, date, time)}
        placeholder="Search by city or timezone"
        className="pr-9"
        onFocus={() => {
          setOpen(true)
          setQuery('')
          setActive(0)
        }}
        onClick={() => {
          if (!open) {
            setOpen(true)
            setQuery('')
            setActive(0)
          }
        }}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
          setActive(0)
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            setOpen(true)
            setActive((index) =>
              Math.max(
                0,
                Math.min(
                  options.length - 1,
                  index + (event.key === 'ArrowDown' ? 1 : -1),
                ),
              ),
            )
          } else if (event.key === 'Enter' && open) {
            event.preventDefault()
            if (options[active]) select(options[active])
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setOpen(false)
            setQuery('')
          }
        }}
      />
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-3 size-4 text-muted-foreground"
      />
      {open && (
        <div
          ref={listRef}
          id={`${id}-options`}
          role="listbox"
          aria-label="Timezones"
          className="absolute top-full z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover p-1 shadow-md"
        >
          {options.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No matching timezones. Try a city such as Berlin.
            </p>
          )}
          {options.map((zone, index) => (
            <div
              key={zone}
              id={`${id}-option-${index}`}
              data-index={index}
              role="option"
              aria-selected={zone === value}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm',
                index === active && 'bg-accent',
              )}
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => select(zone)}
            >
              <Check
                aria-hidden="true"
                className={cn('size-4 shrink-0', zone !== value && 'invisible')}
              />
              <span>
                <span className="block">
                  {timeZoneLabel(zone, date, time)}
                  {zone === deviceZone ? ' · Your timezone' : ''}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {zone}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
