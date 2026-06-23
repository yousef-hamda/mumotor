# DriveSawa backend — multi-stage build for Railway.
FROM node:20-slim AS build
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/package.json
RUN npm install --workspace @otto/backend --include-workspace-root
COPY packages/backend ./packages/backend
# prisma generate + tsc
RUN npm run build --workspace @otto/backend

FROM node:20-slim AS prod
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=staging
COPY package.json package-lock.json* ./
COPY packages/backend/package.json packages/backend/package.json
RUN npm install --omit=dev --workspace @otto/backend --include-workspace-root
COPY packages/backend/prisma ./packages/backend/prisma
# regenerate the Prisma client for the production image
RUN npm run db:generate --workspace @otto/backend
COPY --from=build /app/packages/backend/dist ./packages/backend/dist
EXPOSE 3001
# Railway assigns PORT dynamically; the app reads it from env.
CMD ["node", "packages/backend/dist/index.js"]
