import { useCallback, useEffect, useMemo, useState } from 'react'
import { RubroNode } from '@/interfaces/rubros'

type SimpleNode = { id: string; label: string }

export type RubroCascadeFiltersInput = {
  tipos: RubroNode[]
  rubros: RubroNode[]
  todosLosSubtipos: SimpleNode[]
  todasLasMarcas: SimpleNode[]
  searchCategoria?: string
  searchSubtipo?: string
  searchMarca?: string
  /** Sincroniza estado desde URL u otra fuente externa (tipo/subtipo/marca por label). */
  externalFilters?: {
    tipo: string | null
    subtipo: string | null
    marca: string | null
  }
}

function normalizeText(text?: string | null): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function findRubroByLabel(tipos: RubroNode[], label: string): RubroNode | null {
  if (!label) return null
  const norm = normalizeText(label)
  return (
    tipos.find((t) => normalizeText(t.label) === norm || normalizeText(t.id) === norm) ??
    null
  )
}

function findSubtipoInRubro(rubro: RubroNode, label: string): RubroNode | null {
  if (!label || !rubro.children) return null
  const norm = normalizeText(label)
  return (
    rubro.children.find((s) => normalizeText(s.label) === norm || normalizeText(s.id) === norm) ??
    null
  )
}

function findRubrosContainingSubtipo(tipos: RubroNode[], label: string): RubroNode[] {
  const norm = normalizeText(label)
  if (!norm) return []
  return tipos.filter((r) =>
    r.children?.some((s) => normalizeText(s.label) === norm || normalizeText(s.id) === norm)
  )
}

function findSubtipoAnywhere(tipos: RubroNode[], label: string): RubroNode | null {
  for (const r of tipos) {
    const found = findSubtipoInRubro(r, label)
    if (found) return found
  }
  return null
}

export function useRubroCascadeFilters({
  tipos,
  rubros,
  todosLosSubtipos,
  todasLasMarcas,
  searchCategoria = '',
  searchSubtipo = '',
  searchMarca = '',
  externalFilters,
}: RubroCascadeFiltersInput) {
  const [selectedRubro, setSelectedRubro] = useState<RubroNode | null>(null)
  const [selectedSubtipo, setSelectedSubtipo] = useState<RubroNode | null>(null)
  const [selectedMarca, setSelectedMarca] = useState<string | null>(null)

  const syncFromLabels = useCallback(
    (tipo: string | null, subtipo: string | null, marca: string | null) => {
      if (tipo) {
        const found = findRubroByLabel(tipos, tipo)
        if (found) {
          setSelectedRubro(found)
          if (subtipo) {
            const subtipoFound = findSubtipoInRubro(found, subtipo)
            setSelectedSubtipo(subtipoFound)
          } else {
            setSelectedSubtipo(null)
          }
        } else {
          setSelectedRubro(null)
          setSelectedSubtipo(null)
        }
      } else if (subtipo) {
        const parents = findRubrosContainingSubtipo(tipos, subtipo)
        setSelectedRubro(parents.length === 1 ? parents[0] : null)
        setSelectedSubtipo(
          (parents.length === 1 ? findSubtipoInRubro(parents[0], subtipo) : null) ??
            findSubtipoAnywhere(tipos, subtipo)
        )
      } else {
        setSelectedRubro(null)
        setSelectedSubtipo(null)
      }

      setSelectedMarca(marca || null)
    },
    [tipos]
  )

  useEffect(() => {
    if (!externalFilters) return
    syncFromLabels(externalFilters.tipo, externalFilters.subtipo, externalFilters.marca)
  }, [
    externalFilters?.tipo,
    externalFilters?.subtipo,
    externalFilters?.marca,
    syncFromLabels,
    externalFilters,
  ])

  const rubrosFiltrados = useMemo(() => {
    let filteredRubros = tipos

    if (selectedMarca) {
      const normMarca = normalizeText(selectedMarca)
      filteredRubros = filteredRubros.filter((r) => {
        if (!r.children) return false
        return r.children.some((subt) => {
          if (!subt.children) return false
          return subt.children.some(
            (m) => normalizeText(m.label) === normMarca || normalizeText(m.id) === normMarca
          )
        })
      })
    }

    if (selectedSubtipo && !selectedRubro) {
      const parents = findRubrosContainingSubtipo(filteredRubros, selectedSubtipo.label)
      if (parents.length > 0) {
        filteredRubros = parents
      }
    }

    const normSearch = normalizeText(searchCategoria)
    if (selectedRubro && !normSearch) {
      const only = filteredRubros.find((r) => r.label === selectedRubro.label) ?? selectedRubro
      return [only]
    }

    return filteredRubros
      .filter((r) => !normSearch || normalizeText(r.label).includes(normSearch))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tipos, searchCategoria, selectedMarca, selectedRubro, selectedSubtipo])

  const subtiposFiltrados = useMemo(() => {
    let filteredSubtipos: RubroNode[] = []

    if (selectedMarca) {
      const normMarca = normalizeText(selectedMarca)
      const map = new Map<string, RubroNode>()
      const rubrosToSearch = selectedRubro ? [selectedRubro] : rubros

      for (const r of rubrosToSearch) {
        if (!r.children) continue
        for (const subt of r.children) {
          if (!subt.children) continue
          if (
            subt.children.some(
              (m) => normalizeText(m.label) === normMarca || normalizeText(m.id) === normMarca
            )
          ) {
            map.set(subt.id, subt)
          }
        }
      }
      filteredSubtipos = Array.from(map.values())
    } else if (selectedRubro?.children) {
      filteredSubtipos = selectedRubro.children
    } else {
      filteredSubtipos = todosLosSubtipos.map((s) => ({
        id: s.id,
        label: s.label,
        level: 'subtipo' as const,
      }))
    }

    if (searchSubtipo) {
      const normSearch = normalizeText(searchSubtipo)
      filteredSubtipos = filteredSubtipos.filter((s) =>
        normalizeText(s.label).includes(normSearch)
      )
    }

    return filteredSubtipos
  }, [selectedRubro, selectedMarca, todosLosSubtipos, searchSubtipo, rubros])

  const marcasFiltradasPorRubro = useMemo(() => {
    if (selectedSubtipo?.children) {
      return selectedSubtipo.children.map((m) => ({ id: m.id, label: m.label }))
    }

    if (selectedRubro?.children) {
      const map = new Map<string, { id: string; label: string }>()
      selectedRubro.children.forEach((subtipo) => {
        subtipo.children?.forEach((marca) => {
          map.set(marca.id, { id: marca.id, label: marca.label })
        })
      })
      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    }

    return todasLasMarcas
  }, [selectedRubro, selectedSubtipo, todasLasMarcas])

  const marcasFiltradas = useMemo(() => {
    const normSearch = normalizeText(searchMarca)
    if (selectedMarca && !normSearch) {
      const only =
        marcasFiltradasPorRubro.find(
          (m) =>
            normalizeText(m.label) === normalizeText(selectedMarca) ||
            normalizeText(m.id) === normalizeText(selectedMarca)
        ) ?? { id: selectedMarca, label: selectedMarca }
      return [only]
    }
    return marcasFiltradasPorRubro
      .filter((m) => !normSearch || normalizeText(m.label).includes(normSearch))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [marcasFiltradasPorRubro, searchMarca, selectedMarca])

  const selectRubro = useCallback(
    (rubro: RubroNode | null) => {
      setSelectedRubro(rubro)
      if (!rubro) {
        setSelectedSubtipo(null)
        return
      }
      if (selectedSubtipo && !rubro.children?.some((s) => s.label === selectedSubtipo.label)) {
        setSelectedSubtipo(null)
      }
      if (selectedMarca) {
        const normMarca = normalizeText(selectedMarca)
        const marcaValida = rubro.children?.some((subt) =>
          subt.children?.some(
            (m) => normalizeText(m.label) === normMarca || normalizeText(m.id) === normMarca
          )
        )
        if (!marcaValida) setSelectedMarca(null)
      }
    },
    [selectedSubtipo, selectedMarca]
  )

  const selectSubtipo = useCallback(
    (subtipo: RubroNode | null) => {
      setSelectedSubtipo(subtipo)
      if (!subtipo) return
      if (selectedMarca) {
        const normMarca = normalizeText(selectedMarca)
        const marcaValida = subtipo.children?.some(
          (m) => normalizeText(m.label) === normMarca || normalizeText(m.id) === normMarca
        )
        if (!marcaValida) setSelectedMarca(null)
      }
    },
    [selectedMarca]
  )

  const selectMarca = useCallback(
    (marca: string | null) => {
      if (!marca) {
        setSelectedMarca(null)
        return
      }
      setSelectedMarca(marca)
    },
    []
  )

  const selectTipoByLabel = useCallback(
    (label: string) => {
      if (!label) {
        selectRubro(null)
        return
      }
      selectRubro(findRubroByLabel(tipos, label))
    },
    [tipos, selectRubro]
  )

  const selectSubtipoByLabel = useCallback(
    (label: string) => {
      if (!label) {
        selectSubtipo(null)
        return
      }
      if (selectedRubro) {
        selectSubtipo(findSubtipoInRubro(selectedRubro, label))
        return
      }
      const parents = findRubrosContainingSubtipo(tipos, label)
      const found = findSubtipoAnywhere(tipos, label)
      if (parents.length === 1) {
        setSelectedRubro(parents[0])
      }
      selectSubtipo(found)
    },
    [tipos, selectedRubro, selectSubtipo]
  )

  const resetFilters = useCallback(() => {
    setSelectedRubro(null)
    setSelectedSubtipo(null)
    setSelectedMarca(null)
  }, [])

  return {
    selectedRubro,
    selectedSubtipo,
    selectedMarca,
    selectedTipo: selectedRubro?.label ?? '',
    selectedSubtipoLabel: selectedSubtipo?.label ?? '',
    selectedMarcaLabel: selectedMarca ?? '',
    rubrosFiltrados,
    subtiposFiltrados,
    marcasFiltradas,
    selectRubro,
    selectSubtipo,
    selectMarca,
    selectTipoByLabel,
    selectSubtipoByLabel,
    resetFilters,
    syncFromLabels,
    setSelectedRubro,
    setSelectedSubtipo,
    setSelectedMarca,
  }
}
