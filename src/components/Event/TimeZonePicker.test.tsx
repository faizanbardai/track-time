// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TimeZonePicker, timeZoneLabel } from './TimeZonePicker'

afterEach(cleanup)

describe('timezone picker', () => {
  it('uses the event date for daylight-saving offsets', () => {
    expect(timeZoneLabel('Europe/Berlin', '2026-01-10')).toBe(
      'Berlin (UTC+01:00)',
    )
    expect(timeZoneLabel('Europe/Berlin', '2026-08-10')).toBe(
      'Berlin (UTC+02:00)',
    )
  })

  it('suggests the device zone and selects a city with the keyboard', () => {
    const onChange = vi.fn()
    render(
      <TimeZonePicker
        id="zone"
        value="UTC"
        date="2026-08-10"
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getAllByRole('option')[0].textContent).toContain(
      'Your timezone',
    )
    fireEvent.change(input, { target: { value: 'New York' } })
    expect(screen.getByRole('option').textContent).toContain('America/New_York')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).toHaveBeenCalledWith('America/New_York')
    expect(input.getAttribute('aria-expanded')).toBe('false')
  })

  it('retains the saved selection when a search is cancelled or has no results', () => {
    const onChange = vi.fn()
    render(
      <TimeZonePicker
        id="zone"
        value="Europe/Berlin"
        date="2026-08-10"
        onChange={onChange}
      />,
    )
    const input = screen.getByRole('combobox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'made up timezone' } })
    expect(screen.getByText(/No matching timezones/)).toBeTruthy()
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(onChange).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(input.value).toBe('Berlin (UTC+02:00)')
  })

  it('selects a timezone by clicking its option', () => {
    const onChange = vi.fn()
    render(
      <TimeZonePicker
        id="zone"
        value="UTC"
        date="2026-08-10"
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'Europe/London' },
    })
    fireEvent.click(screen.getByRole('option'))
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  })
})
