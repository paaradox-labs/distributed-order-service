ARG NODE_VERSION=24.18.0

FROM node:${NODE_VERSION}-alpine as builder


WORKDIR /home/node/app


RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci


COPY . .


RUN npm run build


FROM node:${NODE_VERSION}-alpine as runner

USER node

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

ENV NODE_ENV=production

RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts


COPY --from=builder --chown=node:node /home/node/app/dist ./

EXPOSE 5503



CMD ["node", "server.js"]