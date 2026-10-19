ARG NODE_VERSION=22.23.3

FROM node:${NODE_VERSION}-alpine AS server-dependencies

RUN apk add build-base python3 --no-cache

WORKDIR /app

COPY server/package.json server/package-lock.json ./

RUN npm ci --omit=dev --no-audit --no-fund

FROM node:${NODE_VERSION}-alpine AS client

WORKDIR /app

COPY client/package.json client/package-lock.json client/.npmrc ./

RUN npm ci --omit=dev --no-audit --no-fund

COPY client .

RUN DISABLE_ESLINT_PLUGIN=true npm run build

FROM node:${NODE_VERSION}-alpine

# Apply the latest Alpine security patches (libssl3/libcrypto3, musl, zlib, ...)
# and drop the bundled npm CLI: the runtime only ever runs `node`, so removing
# npm eliminates its vulnerable internals (pacote, sigstore, glob, tar, ...).
RUN apk upgrade --no-cache \
  && apk add bash --no-cache \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

USER node
WORKDIR /app

COPY --chown=node:node start.sh .
COPY --chown=node:node healthcheck.js .
COPY --chown=node:node server .

RUN mv .env.sample .env

COPY --from=server-dependencies --chown=node:node /app/node_modules node_modules

COPY --from=client --chown=node:node /app/build public
COPY --from=client --chown=node:node /app/build/index.html views/index.ejs

VOLUME /app/public/user-avatars
VOLUME /app/public/project-background-images
VOLUME /app/private/attachments

EXPOSE 1337

HEALTHCHECK --interval=10s --timeout=2s --start-period=15s \
  CMD node ./healthcheck.js

CMD ["./start.sh"]
