FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Development image
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma@6 generate

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
WORKDIR /app

ARG APP_ENV
ARG NODE_ENV
ARG NEXT_PUBLIC_APP_URL
ARG JWT_SECRET
ARG DATABASE_URL

ENV APP_ENV=${APP_ENV}
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV JWT_SECRET=${JWT_SECRET}
ENV DATABASE_URL=${DATABASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma@6 generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
