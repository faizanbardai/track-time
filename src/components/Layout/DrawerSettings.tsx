'use client'

import { useTheme } from 'next-themes'
import { Settings2 } from 'lucide-react'
import { useSettings } from '@/components/providers/settings'

export function DrawerSettings() {
  const { theme, setTheme } = useTheme()
  const { timeFormat, setTimeFormat } = useSettings()

  return (
    <section aria-labelledby="settings-title" className="border-t p-4">
      <h3
        id="settings-title"
        className="mb-3 flex items-center gap-2 text-sm font-semibold"
      >
        <Settings2 aria-hidden="true" className="size-4" />
        Settings
      </h3>
      <div className="grid gap-3">
        <fieldset className="grid gap-1.5">
          <legend className="text-xs font-medium text-muted-foreground">
            Time format
          </legend>
          <div className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/50 p-1">
            {(['12h', '24h'] as const).map((format) => (
              <label
                key={format}
                className="cursor-pointer rounded-md text-center text-sm font-medium has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm"
              >
                <input
                  type="radio"
                  name="time-format"
                  value={format}
                  checked={timeFormat === format}
                  onChange={() => setTimeFormat(format)}
                  className="peer sr-only"
                />
                <span className="block rounded-md px-3 py-1.5 text-muted-foreground peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
                  {format}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-1.5">
          <legend className="text-xs font-medium text-muted-foreground">
            Theme
          </legend>
          <div className="grid grid-cols-3 gap-1 rounded-lg border bg-muted/50 p-1">
            {(['light', 'dark', 'system'] as const).map((option) => (
              <label
                key={option}
                className="cursor-pointer rounded-md text-center text-sm font-medium capitalize has-[:checked]:bg-background has-[:checked]:text-foreground has-[:checked]:shadow-sm"
              >
                <input
                  type="radio"
                  name="app-theme"
                  value={option}
                  checked={(theme ?? 'system') === option}
                  onChange={() => setTheme(option)}
                  className="peer sr-only"
                />
                <span className="block rounded-md px-2 py-1.5 text-muted-foreground peer-checked:text-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-ring">
                  {option}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </section>
  )
}
