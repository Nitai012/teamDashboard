# ---- build: install, test-free production build of all packages ----
FROM node:22-bookworm-slim AS build
WORKDIR /app
RUN corepack enable
# Build tools for better-sqlite3, used only when no prebuilt binary matches.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build
# A self-contained copy of the API with production dependencies only.
RUN pnpm --filter @team-radar/api deploy --prod --legacy /out/api

# ---- runtime: API serving the built web app ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    DATABASE_PATH=/data/team-radar.db \
    WEB_DIST_PATH=/app/web
WORKDIR /app/api

COPY --from=build /out/api ./
COPY --from=build /app/apps/web/dist /app/web
RUN mkdir -p /data && chown node:node /data

USER node
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
