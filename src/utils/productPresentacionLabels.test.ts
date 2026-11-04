import { describe, expect, it } from 'vitest'
import { pesoPresentacionLabel } from './productPresentacionLabels'

describe('pesoPresentacionLabel', () => {
    it('formatea a 2 decimales (evita float basura)', () => {
        expect(pesoPresentacionLabel({ peso: 12.699999809265137, unidadPeso: 'KGS' })).toBe(
            '12,70 Kgs',
        )
        expect(pesoPresentacionLabel({ peso: 0.12700000405311584, unidadPeso: 'KGS' })).toBe(
            '0,13 Kgs',
        )
    })
})
