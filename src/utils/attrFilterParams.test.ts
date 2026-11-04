import { describe, expect, it } from 'vitest';
import {
  attrFieldSuffix,
  attrParamsDependencyKey,
  attrSuffixFromUrlParamKey,
  attrUrlParamKey,
  collectAttrParamsFromSearchParams,
  findFacetValuesBySuffix,
  isAttrValueAllowedInFacets,
  deleteAttrParamsForDisplayName,
  findAttrDisplayName,
  findAttrUrlParamKeyInSearchParams,
  getAttrParamValue,
  isAttrParamSelected,
  isAttrValueEqual,
} from './attrFilterParams';

describe('attrFilterParams', () => {
  it('attrUrlParamKey normaliza espacios y diacríticos', () => {
    expect(attrUrlParamKey('ANCHO')).toBe('attr_ANCHO');
    expect(attrUrlParamKey('RELACION DE ASPECTO')).toBe('attr_RELACION_DE_ASPECTO');
    expect(attrUrlParamKey('PUNTO DE RUPTURA (lb)')).toBe('attr_PUNTO_DE_RUPTURA_LB');
  });

  it('attrFieldSuffix coincide con backend', () => {
    expect(attrFieldSuffix('INDICE DE CARGA')).toBe('INDICE_DE_CARGA');
    expect(attrFieldSuffix('PUNTO DE RUPTURA (lb)')).toBe('PUNTO_DE_RUPTURA_LB');
  });

  it('collectAttrParamsFromSearchParams preserva attr_*', () => {
    const sp = new URLSearchParams('tipo=CUBIERTAS&attr_ANCHO=120&attr_MEDIDA=120%2F70-17');
    const collected = collectAttrParamsFromSearchParams(sp);
    expect(collected).toEqual({
      attr_ANCHO: '120',
      attr_MEDIDA: '120/70-17',
    });
  });

  it('attrParamsDependencyKey ordena params', () => {
    const sp = new URLSearchParams('attr_ANCHO=120&attr_MEDIDA=90/90-17');
    expect(attrParamsDependencyKey(sp)).toBe('attr_ANCHO=120&attr_MEDIDA=90/90-17');
  });

  it('findAttrDisplayName resuelve facet por sufijo', () => {
    const candidates = ['ANCHO', 'RELACION DE ASPECTO'];
    expect(findAttrDisplayName('RELACION_DE_ASPECTO', candidates)).toBe('RELACION DE ASPECTO');
    expect(findAttrDisplayName('ANCHO', candidates)).toBe('ANCHO');
  });

  it('attrSuffixFromUrlParamKey', () => {
    expect(attrSuffixFromUrlParamKey('attr_ANCHO')).toBe('ANCHO');
  });

  it('getAttrParamValue resuelve clave legacy y normalizada', () => {
    const legacy = new URLSearchParams('attr_RELACION DE ASPECTO=70');
    expect(getAttrParamValue('RELACION DE ASPECTO', legacy)).toBe('70');

    const normalized = new URLSearchParams('attr_RELACION_DE_ASPECTO=70');
    expect(getAttrParamValue('RELACION DE ASPECTO', normalized)).toBe('70');
  });

  it('deleteAttrParamsForDisplayName elimina todas las variantes de clave', () => {
    const params = new URLSearchParams(
      'attr_RELACION DE ASPECTO=70&attr_RELACION_DE_ASPECTO=70&attr_ANCHO=120',
    );
    deleteAttrParamsForDisplayName(params, 'RELACION DE ASPECTO');
    expect(params.toString()).toBe('attr_ANCHO=120');
  });

  it('findFacetValuesBySuffix resuelve PUNTO DE RUPTURA (lb)', () => {
    const facets = { 'PUNTO DE RUPTURA (lb)': ['4293', '4300'] };
    expect(findFacetValuesBySuffix(facets, 'PUNTO_DE_RUPTURA_LB')).toEqual(['4293', '4300']);
    expect(isAttrValueAllowedInFacets(facets, 'attr_PUNTO_DE_RUPTURA_LB', '4293')).toBe(true);
    expect(isAttrValueAllowedInFacets(facets, 'attr_PUNTO_DE_RUPTURA_LB', '9999')).toBe(false);
  });

  it('isAttrParamSelected compara sin distinguir mayúsculas', () => {
    const sp = new URLSearchParams('attr_POSICION=trasera');
    expect(isAttrParamSelected('POSICION', 'TRASERA', sp)).toBe(true);
    expect(isAttrParamSelected('POSICION', 'delantera', sp)).toBe(false);
  });
});
