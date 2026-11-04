export type RubroNode = {
  id: string
  label: string
  level?: 'tipo' | 'subtipo' | 'marca'
  children?: RubroNode[]
}