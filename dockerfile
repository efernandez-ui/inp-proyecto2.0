# --- Etapa 1: Instalación de dependencias ---
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: Construcción (Build) ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# --- INYECCIÓN DE VARIABLES DE ENTORNO ---
# Recibimos el argumento del docker-compose
ARG NEXT_PUBLIC_API_BACKEND
# Lo convertimos en ENV para que 'next build' lo vea
ENV NEXT_PUBLIC_API_BACKEND=$NEXT_PUBLIC_API_BACKEND
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Etapa 3: Ejecución (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Permisos para el caché de imágenes
RUN mkdir -p .next/cache/images && chown -R nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]