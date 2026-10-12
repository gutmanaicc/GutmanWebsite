# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The optional secret supplies a managed build proxy CA without embedding it.
# On an ordinary VPS npm uses the normal trusted CA store.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --strict-ssl=true; else npm ci --strict-ssl=true; fi
COPY . .
RUN npm run build && npm run self-hosted:build-api

FROM node:24-bookworm-slim AS runtime
ARG GUTMAN_SOURCE_REVISION=uncommitted-local
LABEL org.opencontainers.image.revision=$GUTMAN_SOURCE_REVISION
ENV NODE_ENV=production PORT=3000 ACADEMY_DB_PATH=/data/academy.sqlite ACADEMY_PREVIEW=1
WORKDIR /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/.self-hosted-api ./.self-hosted-api
COPY --from=build --chown=node:node /app/server ./server
COPY --from=build --chown=node:node /app/shared ./shared
COPY --from=build --chown=node:node /app/scripts/self-hosted-start.mjs ./scripts/self-hosted-start.mjs
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir /data && chown node:node /data && chmod 700 /data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/self-hosted-start.mjs"]
