import type { KeyboardEvent } from 'react'

/** Navegación tipo Excel entre inputs de la vista spreadsheet (Cant. / Bonif. 2). */
export function handleSpreadsheetArrowNav(
  e: KeyboardEvent<HTMLInputElement>,
  row: number,
  col: number,
): void {
  const key = e.key
  if (key !== 'ArrowUp' && key !== 'ArrowDown' && key !== 'ArrowLeft' && key !== 'ArrowRight') {
    return
  }

  let nextRow = row
  let nextCol = col
  if (key === 'ArrowUp') nextRow = row - 1
  if (key === 'ArrowDown') nextRow = row + 1
  if (key === 'ArrowLeft') nextCol = col - 1
  if (key === 'ArrowRight') nextCol = col + 1

  if (nextRow < 0 || nextCol < 0) return

  const el = document.querySelector<HTMLInputElement>(
    `input[data-spreadsheet-cell][data-row="${nextRow}"][data-col="${nextCol}"]`,
  )
  if (!el || el.disabled) return

  e.preventDefault()
  el.focus()
  el.select()
}
