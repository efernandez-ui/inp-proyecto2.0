/** Sufijo del campo ES attr_* (misma normalización que backend / Logstash). */
export function attrFieldSuffix(displayName: string): string {
  if (!displayName?.trim()) return '';
  const normalized = displayName
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
  return normalized;
}

/** Clave de query param en URL: attr_ANCHO, attr_RELACION_DE_ASPECTO, etc. */
export function attrUrlParamKey(displayName: string): string {
  const suffix = attrFieldSuffix(displayName);
  return suffix ? `attr_${suffix}` : '';
}

/** Sufijo desde clave URL (attr_ANCHO → ANCHO). */
export function attrSuffixFromUrlParamKey(paramKey: string): string {
  if (!paramKey?.startsWith('attr_')) return paramKey ?? '';
  return paramKey.slice(5);
}

/** Nombre de facet para chips/UI; busca en candidatos o fallback legible. */
export function findAttrDisplayName(suffix: string, candidates: string[]): string {
  const match = candidates.find((name) => attrFieldSuffix(name) === suffix);
  if (match) return match;
  return suffix.replace(/_/g, ' ');
}

/** Elimina todas las claves attr_* del mismo atributo (normalizada y legacy). */
export function deleteAttrParamsForDisplayName(
  target: URLSearchParams,
  displayName: string,
): void {
  const suffix = attrFieldSuffix(displayName);
  const legacyKey = `attr_${displayName}`;
  const keysToDelete: string[] = [];
  target.forEach((_, key) => {
    if (!key.startsWith('attr_')) return;
    if (key === legacyKey || attrSuffixFromUrlParamKey(key) === suffix) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach((k) => target.delete(k));
}

/** Clave attr_* presente en la URL para un atributo (normalizada o legacy). */
export function findAttrUrlParamKeyInSearchParams(
  displayName: string,
  source: URLSearchParams | null | undefined,
): string | null {
  if (!source) return null;
  const suffix = attrFieldSuffix(displayName);
  const normalized = attrUrlParamKey(displayName);
  if (normalized && source.has(normalized)) return normalized;
  const legacyKey = `attr_${displayName}`;
  if (source.has(legacyKey)) return legacyKey;
  if (!suffix) return normalized || null;
  for (const [key] of source.entries()) {
    if (key.startsWith('attr_') && attrSuffixFromUrlParamKey(key) === suffix) {
      return key;
    }
  }
  return normalized || null;
}

/** Valor activo del atributo en la URL. */
export function getAttrParamValue(
  displayName: string,
  source: URLSearchParams | null | undefined,
): string | null {
  const key = findAttrUrlParamKeyInSearchParams(displayName, source);
  return key ? source?.get(key) ?? null : null;
}

export function isAttrValueEqual(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/** Valores de facet cuyo nombre normaliza al sufijo URL (PUNTO DE RUPTURA (lb) → PUNTO_DE_RUPTURA_LB). */
export function findFacetValuesBySuffix(
  facetData: Record<string, string[]> | null | undefined,
  suffix: string,
): string[] | undefined {
  if (!facetData || !suffix) return undefined;
  if (Object.prototype.hasOwnProperty.call(facetData, suffix) && facetData[suffix]) {
    return facetData[suffix];
  }
  const match = Object.entries(facetData).find(([name]) => attrFieldSuffix(name) === suffix);
  return match?.[1];
}

export function isAttrValueAllowedInFacets(
  facetData: Record<string, string[]> | null | undefined,
  paramKey: string,
  value: string,
): boolean {
  const suffix = attrSuffixFromUrlParamKey(paramKey);
  const allowed = findFacetValuesBySuffix(facetData, suffix);
  return !!allowed?.some((v) => isAttrValueEqual(v, value));
}

export function isAttrParamSelected(
  displayName: string,
  valor: string,
  source: URLSearchParams | null | undefined,
): boolean {
  const current = getAttrParamValue(displayName, source);
  return current != null && isAttrValueEqual(current, valor);
}

export function collectAttrParamsFromSearchParams(
  source: URLSearchParams | null | undefined,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!source) return out;
  source.forEach((value, key) => {
    if (key.startsWith('attr_') && value.trim()) {
      out[key] = value.trim();
    }
  });
  return out;
}

/** Serializa attr_* para dependencias de useEffect. */
export function attrParamsDependencyKey(source: URLSearchParams | null | undefined): string {
  const parts: string[] = [];
  if (!source) return '';
  source.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      parts.push(`${key}=${value}`);
    }
  });
  return parts.sort().join('&');
}

/** Copia attr_* a URLSearchParams destino. */
export function appendAttrParamsToSearchParams(
  target: URLSearchParams,
  source: URLSearchParams | null | undefined,
): void {
  if (!source) return;
  source.forEach((value, key) => {
    if (key.startsWith('attr_')) {
      target.set(key, value);
    }
  });
}
