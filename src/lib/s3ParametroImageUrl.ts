/**
 * URLs públicas de imágenes de banners/popups.
 * Home banners legacy: imagenes/home/{archivo} (público). El prefijo banners/ suele devolver 403 en S3.
 */
const DEFAULT_S3_BASE =
  process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL?.replace(/\/$/, '') ||
  'https://imagenes-inp-aws.s3.amazonaws.com';

const HOME_BANNER_PREFIX = 'imagenes/home';
const POOL_BANNER_PREFIX = 'imagenes/pool';
const POPUP_PREFIX = 'imagenes/popup';

function encodeS3KeyPath(path: string): string {
  return path
    .split('/')
    .map((p) => encodeURIComponent(p))
    .join('/');
}

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i;

function leafFileName(clean: string): string {
  const slash = Math.max(clean.lastIndexOf('/'), clean.lastIndexOf('\\'));
  return slash >= 0 ? clean.substring(slash + 1) : clean;
}

function publicBases(): string[] {
  const bases = new Set<string>();
  bases.add(DEFAULT_S3_BASE);
  bases.add('https://imagenes-inp-aws.s3.us-east-1.amazonaws.com');
  return [...bases];
}

function yearCandidatesForFolder(folder: 'banners' | 'popups', fileLeaf: string): string[] {
  const enc = encodeURIComponent(fileLeaf);
  const y0 = new Date().getFullYear();
  const out: string[] = [];
  for (let d = 0; d <= 6; d++) {
    for (const base of publicBases()) {
      out.push(`${base}/${folder}/${y0 - d}/${enc}`);
    }
  }
  return out;
}

function joinBaseAndPath(base: string, path: string): string {
  const b = base.replace(/\/$/, '');
  const p = path.startsWith('/') ? path.slice(1) : path;
  if (p.startsWith('http://') || p.startsWith('https://')) return p;
  return `${b}/${encodeS3KeyPath(p)}`;
}

/**
 * URLs para banners del home (legacy pathImagenesHome + imagenes/home).
 */
export function homeBannerImageUrlCandidates(
  pathImagen: string | null | undefined,
  pathImagenesHome?: string | null
): string[] {
  if (pathImagen == null) return [];
  const t = String(pathImagen).trim();
  if (!t) return [];
  if (t.startsWith('http://') || t.startsWith('https://')) return [t];

  const out = new Set<string>();
  const clean = t.replace(/^\/+/, '');
  const leaf = leafFileName(clean);

  if (pathImagenesHome?.trim()) {
    out.add(joinBaseAndPath(pathImagenesHome.trim(), clean));
    if (leaf !== clean) {
      out.add(joinBaseAndPath(pathImagenesHome.trim(), leaf));
    }
  }

  for (const base of publicBases()) {
    out.add(`${base}/${HOME_BANNER_PREFIX}/${encodeURIComponent(leaf)}`);
    if (clean.includes('/') && !clean.includes('..') && !clean.startsWith('banners/') && !clean.startsWith('popups/')) {
      out.add(`${base}/${HOME_BANNER_PREFIX}/${encodeS3KeyPath(clean)}`);
    }
  }

  for (const c of parametroS3ImageUrlCandidates(pathImagen, 'banners')) {
    out.add(c);
  }
  return [...out];
}

/**
 * Varios posibles {folder}/… para el mismo dato; el preview prueba en orden.
 */
export function parametroS3ImageUrlCandidates(
  pathImagen: string | null | undefined,
  folder: 'banners' | 'popups'
): string[] {
  if (pathImagen == null) return [];
  const t = String(pathImagen).trim();
  if (!t) return [];
  if (t.startsWith('http://') || t.startsWith('https://')) return [t];

  const out = new Set<string>();
  const clean = t.replace(/^\/+/, '');

  if (folder === 'banners') {
    const leaf = leafFileName(clean);
    for (const base of publicBases()) {
      out.add(`${base}/${HOME_BANNER_PREFIX}/${encodeURIComponent(leaf)}`);
      if (clean.includes('/') && !clean.includes('..') && !clean.startsWith('banners/') && !clean.startsWith('popups/')) {
        out.add(`${base}/${HOME_BANNER_PREFIX}/${encodeS3KeyPath(clean)}`);
      }
    }
  }

  if (folder === 'popups') {
    const leaf = leafFileName(clean);
    for (const base of publicBases()) {
      out.add(`${base}/${POPUP_PREFIX}/${encodeURIComponent(leaf)}`);
      if (clean.includes('/') && !clean.includes('..') && !clean.startsWith('banners/') && !clean.startsWith('popups/')) {
        out.add(`${base}/${POPUP_PREFIX}/${encodeS3KeyPath(clean)}`);
      }
    }
  }

  if (clean.startsWith('banners/') || clean.startsWith('popups/')) {
    const leaf = leafFileName(clean);
    for (const base of publicBases()) {
      if (clean.startsWith('popups/')) {
        out.add(`${base}/${POPUP_PREFIX}/${encodeURIComponent(leaf)}`);
      }
      out.add(`${base}/${encodeS3KeyPath(clean)}`);
    }
    return [...out];
  }
  if (clean.includes('/') && !clean.includes('..')) {
    for (const base of publicBases()) {
      out.add(`${base}/${folder}/${encodeS3KeyPath(clean)}`);
    }
    return [...out];
  }

  const flatCandidates: string[] = [];
  for (const base of publicBases()) {
    flatCandidates.push(`${base}/${folder}/${encodeURIComponent(clean)}`);
    if (folder === 'popups') {
      flatCandidates.push(`${base}/popup/${encodeURIComponent(clean)}`);
    }
  }
  const withYears = yearCandidatesForFolder(folder, clean);
  if (UUID_LIKE.test(clean)) {
    return [...withYears, ...flatCandidates, ...out];
  }
  return [...flatCandidates, ...withYears, ...out];
}

/** Primer candidato; útil para href simples. */
export function parametroS3ImageUrl(
  pathImagen: string | null | undefined,
  folder: 'banners' | 'popups'
): string | null {
  const c = parametroS3ImageUrlCandidates(pathImagen, folder);
  return c.length > 0 ? c[0]! : null;
}

export function homePopupImageUrlCandidates(
  pathImagen: string | null | undefined,
  imageUrlFromApi?: string | null,
): string[] {
  const fromApi = imageUrlFromApi?.trim();
  let path = pathImagen?.trim() ?? '';
  if (path.startsWith('popups/')) path = path.slice('popups/'.length);
  if (path.startsWith('popup/')) path = path.slice('popup/'.length);
  const fromPath = parametroS3ImageUrlCandidates(path || pathImagen, 'popups');
  if (!fromApi) return fromPath;
  // API puede devolver popups/archivo (403); priorizar candidatos con año / imagenes/popup
  const apiInPath = fromPath.includes(fromApi);
  if (apiInPath) {
    return [fromApi, ...fromPath.filter((u) => u !== fromApi)];
  }
  return [...fromPath, fromApi];
}

export function homePopupImageUrl(
  pathImagen: string | null | undefined,
  imageUrlFromApi?: string | null,
): string | null {
  const c = homePopupImageUrlCandidates(pathImagen, imageUrlFromApi);
  return c.length > 0 ? c[0]! : null;
}

export function homeBannerImageUrl(
  pathImagen: string | null | undefined,
  pathImagenesHome?: string | null,
  imageUrlFromApi?: string | null
): string | null {
  if (imageUrlFromApi?.trim()) return imageUrlFromApi.trim();
  const c = homeBannerImageUrlCandidates(pathImagen, pathImagenesHome);
  return c.length > 0 ? c[0]! : null;
}

/** URLs para banners de ofertas (USR_POOL_PATHIB → imagenes/pool). */
export function poolBannerImageUrlCandidates(
  pathBanner: string | null | undefined,
  pathImagenesPrincipal?: string | null,
  imageUrlFromApi?: string | null,
): string[] {
  const fromApi = imageUrlFromApi?.trim();
  if (pathBanner == null && !fromApi) return [];
  const t = String(pathBanner ?? '').trim();
  if (!t && !fromApi) return [];
  if (t.startsWith('http://') || t.startsWith('https://')) return [t];

  const out = new Set<string>();
  const clean = t.replace(/^\/+/, '');
  const leaf = leafFileName(clean);

  if (pathImagenesPrincipal?.trim()) {
    out.add(joinBaseAndPath(pathImagenesPrincipal.trim(), clean));
    if (leaf !== clean) {
      out.add(joinBaseAndPath(pathImagenesPrincipal.trim(), leaf));
    }
  }

  for (const base of publicBases()) {
    if (leaf) {
      out.add(`${base}/${POOL_BANNER_PREFIX}/${encodeURIComponent(leaf)}`);
      out.add(`${base}/pool/${encodeURIComponent(leaf)}`);
    }
    if (clean.includes('/') && !clean.includes('..')) {
      out.add(`${base}/${POOL_BANNER_PREFIX}/${encodeS3KeyPath(clean)}`);
    }
  }

  const fromPath = [...out];
  if (!fromApi) return fromPath;
  if (fromPath.includes(fromApi)) {
    return [fromApi, ...fromPath.filter((u) => u !== fromApi)];
  }
  return [...fromPath, fromApi];
}

export function poolBannerImageUrl(
  pathBanner: string | null | undefined,
  pathImagenesPrincipal?: string | null,
  imageUrlFromApi?: string | null,
): string | null {
  const c = poolBannerImageUrlCandidates(pathBanner, pathImagenesPrincipal, imageUrlFromApi);
  return c.length > 0 ? c[0]! : null;
}
