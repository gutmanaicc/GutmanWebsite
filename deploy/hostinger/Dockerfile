# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
# The optional secret supplies a managed build proxy CA without embedding it.
# On an ordinary VPS npm uses the normal trusted CA store.
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then NODE_EXTRA_CA_CERTS=/run/secrets/proxy_ca npm ci --strict-ssl=true; else npm ci --strict-ssl=true; fi
COPY . .
ARG VITE_ACADEMY_TESTIMONIAL_ENABLED=0
ENV VITE_ACADEMY_TESTIMONIAL_ENABLED=$VITE_ACADEMY_TESTIMONIAL_ENABLED
ARG VITE_ACADEMY_MEASUREMENT_ENABLED=0
ARG VITE_ACADEMY_MEASUREMENT_ORIGIN=
ENV VITE_ACADEMY_MEASUREMENT_ENABLED=$VITE_ACADEMY_MEASUREMENT_ENABLED VITE_ACADEMY_MEASUREMENT_ORIGIN=$VITE_ACADEMY_MEASUREMENT_ORIGIN
ARG VITE_ACADEMY_PRODUCTION_APPROVED=0
ARG ACADEMY_DEPLOYMENT_TARGET=hostinger-preview
ENV VITE_ACADEMY_PRODUCTION_APPROVED=$VITE_ACADEMY_PRODUCTION_APPROVED ACADEMY_DEPLOYMENT_TARGET=$ACADEMY_DEPLOYMENT_TARGET
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
COPY --from=build --chown=node:node /app/scripts/self-hosted-media-seed.mjs ./scripts/self-hosted-media-seed.mjs
COPY --from=build --chown=node:node /app/package.json ./package.json
RUN mkdir -p /data /media /app/dist/videos/first-cohort && chown node:node /data /media /app/dist/videos/first-cohort && chmod 700 /data && chmod 755 /media /app/dist/videos/first-cohort
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "scripts/self-hosted-start.mjs"]

# Optional media bootstrap image. The application runtime does not install ffmpeg.
FROM runtime AS media-tools
USER root
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then \
      apt-get -o Acquire::https::CaInfo=/run/secrets/proxy_ca update && apt-get -o Acquire::https::CaInfo=/run/secrets/proxy_ca install -y --no-install-recommends ffmpeg; \
    else apt-get update && apt-get install -y --no-install-recommends ffmpeg; fi \
    && rm -rf /var/lib/apt/lists/*
USER node

# Preserve the small application image as the default build target.
FROM runtime AS production
