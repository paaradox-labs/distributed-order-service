ARG NODE_VERSION=24.18.0

FROM node:${NODE_VERSION}-alpine as builder

RUN corepack enable && corepack prepare pnpm@11 --activate

WORKDIR /home/node/app

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm run build


FROM node:${NODE_VERSION}-alpine as runner

RUN corepack enable && corepack prepare pnpm@11 --activate

USER node

RUN mkdir -p /home/node/app

WORKDIR /home/node/app

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder --chown=node:node /home/node/app/dist ./

EXPOSE 5503

CMD ["node", "server.js"]
