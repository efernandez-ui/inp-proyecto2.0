import { RubroNode } from '@/interfaces/rubros'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api`

export interface RubroApi {
  _id?: string
  tipoDescripcion: string
  tipoId: string
  subtipoDescripcion?: string
  subtipoId?: string
  marcaDescripcion?: string
  marcaId?: string
  subtipos?: SubtipoApi[]
  nombre?: string
}

export interface SubtipoApi {
  _id?: string
  nombre?: string
  subtipoId: string
  subtipoDescripcion: string
  marcas?: MarcaApi[]
}

export interface MarcaApi {
  _id?: string
  marcaId: string
  marcaDescripcion: string
  nombre?: string
}

export type GetRubrosParams = Record<string, string | number | boolean | undefined | null>

const rubrosCache = new Map<string, RubroNode[]>()

const normalizeId = (id: string) => (id ? id.trim() : '')

const mapRubrosToMenu = (rubros: RubroApi[]): RubroNode[] => {
  if (!Array.isArray(rubros)) return []
  return rubros.map((rubro) => ({
    id: normalizeId(rubro.tipoId),
    label: rubro.tipoDescripcion || rubro.tipoId,
    children: (rubro.subtipos || []).map((subtipo) => ({
      id: normalizeId(subtipo.subtipoId),
      label: subtipo.subtipoDescripcion || subtipo.subtipoId,
      children: (subtipo.marcas || []).map((marca) => ({
        id: normalizeId(marca.marcaId),
        label: marca.marcaDescripcion || marca.marcaId,
      })),
    })),
  }))
}

export const getRubros = async (
  params?: GetRubrosParams,
  customHeaders?: HeadersInit
): Promise<RubroNode[]> => {
  const searchParams = new URLSearchParams()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
  }

  const queryString = searchParams.toString()
  const cacheKey = queryString || '__default__'

  if (rubrosCache.has(cacheKey)) {
    return rubrosCache.get(cacheKey)!
  }

  const url = queryString
    ? `${API_BASE_URL}/public/rubros?${queryString}`
    : `${API_BASE_URL}/public/rubros`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch rubros')
  }

  const data: RubroApi[] = await response.json()
  const mapped = mapRubrosToMenu(data)

  rubrosCache.set(cacheKey, mapped)
  return mapped
}

