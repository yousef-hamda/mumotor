# Mumotor — single-service image for Railway (API + published sites + SPA).
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
RUN npm run build --workspace @mumotor/backend
RUN npm run build --workspace @mumotor/frontend

FROM node:20-slim AS prod
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/package.json
RUN npm install --omit=dev --workspace @mumotor/backend --include-workspace-root
COPY packages/backend/prisma ./packages/backend/prisma
# reuse the Prisma client generated during the build stage (prisma CLI is a devDep)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
COPY --from=build /app/packages/frontend/dist ./packages/frontend/dist
# Railway assigns PORT dynamically; the app reads it from env and serves API + SPA.
CMD ["node", "packages/backend/dist/index.js"]
