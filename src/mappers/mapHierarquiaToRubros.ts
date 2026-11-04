import { RubroNode } from "@/interfaces/rubros"
type HierarquiaTipo = {
  tipoId: string
  tipoDescripcion: string
  subtipos: {
    subtipoId: string
    subtipoDescripcion: string
    marcas: {
      marcaId: string
      marcaDescripcion: string
    }[]
  }[]
}
export function mapHierarquiaToRubros(data: HierarquiaTipo[]): RubroNode[] {
  return data.map(tipo => ({
    id: tipo.tipoId.trim(),
    label: tipo.tipoDescripcion.trim(),
    children: tipo.subtipos?.map(subtipo => ({
      id: subtipo.subtipoId.trim(),
      label: subtipo.subtipoDescripcion.trim(),
      children: subtipo.marcas?.map(marca => ({
        id: marca.marcaId.trim(),
        label: marca.marcaDescripcion.trim()
      }))
    }))
  }))
}
