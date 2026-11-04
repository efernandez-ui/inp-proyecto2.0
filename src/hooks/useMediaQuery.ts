'use client'

import { useEffect, useState } from 'react'

/** true cuando el media query coincide (solo en cliente; SSR = false). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    const update = () => setMatches(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [query])

  return matches
}

/** Desktop a partir de Tailwind `md` (768px): habilita vista Excel del catálogo. */
export function useIsCatalogDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}
