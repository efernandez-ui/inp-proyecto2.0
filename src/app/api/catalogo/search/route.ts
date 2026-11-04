import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

function normalizeBase(raw: string): string {
  const v = (raw || '').trim().replace(/\/+$/, '');
  if (!v) return '';
  // En Docker, localhost apunta al contenedor mismo; en host, puede funcionar.
  // Dejamos el valor, pero agregamos un fallback (host.docker.internal) en la lista de candidatos.
  return v;
}

function candidateBases(): string[] {
  // Orden: primero red interna de Docker, luego el backend público.
  const bases: string[] = [];
  const internal = normalizeBase(process.env.INTERNAL_API_URL || '');
  const publicBase = normalizeBase(process.env.NEXT_PUBLIC_API_BACKEND || '');

  if (internal) bases.push(internal);
  if (publicBase && publicBase !== internal) bases.push(publicBase);

  // Fallbacks comunes cuando el valor configurado es localhost.
  for (const b of [...bases]) {
    if (/^https?:\/\/localhost(?::\d+)?$/i.test(b)) {
      const alt = b.replace('localhost', 'host.docker.internal');
      if (!bases.includes(alt)) bases.push(alt);
    }
  }

  return bases;
}

export async function GET(request: Request) {
  const bases = candidateBases();
  if (bases.length === 0) {
    return NextResponse.json(
      { message: 'Backend no configurado (INTERNAL_API_URL / NEXT_PUBLIC_API_BACKEND)' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const hasAuth = !!request.headers.get('authorization');
  // Si hay sesión, usar el endpoint privado (ProductoController). Si no, usar público.
  const path = hasAuth ? '/api/productos/search' : '/api/public/productos/search';

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  if (auth) headers.set('authorization', auth);
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);

  const attempts: Array<{ base: string; target: string; error: string }> = [];

  for (const base of bases) {
    const target = `${base}${path}${url.search}`;
    try {
      const res = await fetch(target, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      const body = await res.text();
      return new NextResponse(body, {
        status: res.status,
        headers: {
          'content-type': res.headers.get('content-type') || 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    } catch (e) {
      const anyErr = e as any;
      const code = anyErr?.cause?.code || anyErr?.code;
      const msg = e instanceof Error ? e.message : String(e);
      attempts.push({
        base,
        target,
        error: code ? `${code}: ${msg}` : msg,
      });
    }
  }

  return NextResponse.json(
    {
      message: 'No se pudo conectar al backend para /productos/search',
      attempts,
    },
    { status: 500 }
  );
}

