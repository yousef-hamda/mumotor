# DriveSawa — single-service image for Railway (API + published sites + SPA).
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json
RUN npm install
COPY packages/backend ./packages/backend
COPY packages/frontend ./packages/frontend
# backend: prisma generate + tsc ; frontend: vite build (uses relative /api → same origin)
RUN npm run build --workspace @otto/backend
RUN npm run build --workspace @otto/frontend

FROM node:20-slim AS prod
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=staging
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/package.json
RUN npm install --omit=dev --workspace @otto/backend --include-workspace-root
COPY packages/backend/prisma ./packages/backend/prisma
RUN npm run db:generate --workspace @otto/backend
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/frontend/dist ./packages/frontend/dist
EXPOSE 3001
# Railway assigns PORT dynamically; the app reads it from env and serves API + SPA.
CMD ["node", "packages/backend/dist/index.js"]
