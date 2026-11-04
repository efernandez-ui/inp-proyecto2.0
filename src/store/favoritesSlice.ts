import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit'
import * as favoritesService from '../services/favorites'

export type FavoriteKey = string // `${tippro}${artcod}`

interface FavoritesState {
  keys: Record<FavoriteKey, true>
  isLoading: boolean
}

const initialState: FavoritesState = {
  keys: {},
  isLoading: false,
}

const toKey = (tippro: string, artcod: string): FavoriteKey => `${(tippro || '').trim()}${(artcod || '').trim()}`

export const fetchFavorites = createAsyncThunk('favorites/fetch', async ({ token }: { token: string }) => {
  const list = await favoritesService.listFavorites(token)
  return list.map((f) => toKey(f.tippro, f.artcod))
})

export const toggleFavorite = createAsyncThunk(
  'favorites/toggle',
  async (
    { token, tippro, artcod, nextIsFavorite }: { token: string; tippro: string; artcod: string; nextIsFavorite: boolean },
  ) => {
    if (nextIsFavorite) {
      await favoritesService.addFavorite(token, tippro, artcod)
    } else {
      await favoritesService.removeFavorite(token, tippro, artcod)
    }
    return { key: toKey(tippro, artcod), nextIsFavorite }
  },
)

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    setFavoritesKeys: (state, action: PayloadAction<FavoriteKey[]>) => {
      state.keys = {}
      for (const k of action.payload) state.keys[k] = true
    },
    clearFavorites: (state) => {
      state.keys = {}
      state.isLoading = false
    },
    setFavoriteLocal: (state, action: PayloadAction<{ key: FavoriteKey; isFavorite: boolean }>) => {
      if (action.payload.isFavorite) state.keys[action.payload.key] = true
      else delete state.keys[action.payload.key]
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFavorites.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.isLoading = false
        state.keys = {}
        for (const k of action.payload) state.keys[k] = true
      })
      .addCase(fetchFavorites.rejected, (state) => {
        state.isLoading = false
      })
      .addCase(toggleFavorite.fulfilled, (state, action) => {
        if (action.payload.nextIsFavorite) state.keys[action.payload.key] = true
        else delete state.keys[action.payload.key]
      })
  },
})

export const { setFavoritesKeys, clearFavorites, setFavoriteLocal } = favoritesSlice.actions
export { toKey as favoriteKey }
export default favoritesSlice.reducer

