This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Variables de entorno (⚙️)

Este proyecto usa el sistema de variables de entorno de Next.js. Añade tus valores locales en un fichero `.env.local` (este fichero está ignorado por git por defecto) y utiliza `.env.example` como plantilla compartible.

También se reorganizó la sección "Información" para usar rutas dedicadas y un layout compartido (`InfoLayout`):

- `/info/bancos`  → Bancos
- `/info/informacion-util` → Información útil
- `/info/almacenes` → Almacenes
- `/info/forma-parte` → Forma parte
- `/info/quiero-ser-cliente` → Quiero ser cliente
- `/info/ayuda-rapida` → Ayuda rápida

El endpoint legacy `/banks` ahora redirige automáticamente a `/info/bancos`.

- Las variables que necesites exponer al cliente deben empezar con `NEXT_PUBLIC_` (ej. `NEXT_PUBLIC_API_URL`).
- Las variables sensibles (secretos, claves) NO deben llevar `NEXT_PUBLIC_` y no deben versionarse.

Ejemplos:

```env
# .env.local (no commitear)
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXTAUTH_SECRET=tu-secreto-aqui
NODE_ENV=development
```

Cómo usar un puerto distinto al por defecto al arrancar en desarrollo:

- Pasa el puerto directamente a `next dev` (compatible en Windows y Unix):

```bash
npm run dev -- -p 4000
```

- Alternativamente puedes exportar `PORT` antes de ejecutar (o usar `cross-env` si lo prefieres):

```bash
# Unix
PORT=4000 npm run dev
# Windows (PowerShell)
$env:PORT=4000; npm run dev
# O instalar cross-env y usar:
npm install -D cross-env
npx cross-env PORT=4000 npm run dev
```

Next.js carga automáticamente variables de archivos `.env*` (ver docs: https://nextjs.org/docs/basic-features/environment-variables).

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy-pages.yml` genera y publica una exportación estática al hacer push a `main` (también se puede ejecutar manualmente desde Actions). Para habilitar la primera publicación, configura **Settings → Pages → Build and deployment → Source: GitHub Actions**.

La página se publicará en `https://efernandez-ui.github.io/inp-proyecto2.0/`. GitHub Pages no ejecuta el servidor de Next.js: el workflow excluye las rutas de API y las páginas dinámicas de detalle de producto y edición de ventas especiales, y reemplaza el catálogo interactivo por un aviso estático. Las funciones que dependen del backend (por ejemplo, autenticación, carrito, pedidos y administración) no estarán operativas en esta publicación estática. La configuración de Docker y la ejecución normal del proyecto siguen usando el servidor Next.js.
