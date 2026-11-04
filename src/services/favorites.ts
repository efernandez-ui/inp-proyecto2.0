const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BACKEND}/api/favoritos`

export interface FavoriteDTO {
  tippro: string
  artcod: string
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function listFavorites(token: string): Promise<FavoriteDTO[]> {
  const res = await fetch(API_BASE_URL, { method: 'GET', headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to fetch favorites')
  return res.json()
}

export async function addFavorite(token: string, tippro: string, artcod: string): Promise<void> {
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ tippro, artcod }),
  })
  if (!res.ok) throw new Error('Failed to add favorite')
}

export async function removeFavorite(token: string, tippro: string, artcod: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/${encodeURIComponent(tippro)}/${encodeURIComponent(artcod)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error('Failed to remove favorite')
}

