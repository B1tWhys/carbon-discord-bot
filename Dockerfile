FROM node:23-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN apt update && apt install -y libnss3-dev libglib2.0-dev libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm-dev libxcomposite-dev libxdamage1 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libcairo-5c0 libasound2
    # && apt clean && rm -rf /var/lib/apt/lists/*
    RUN corepack enable && corepack install -g pnpm@latest
USER node
WORKDIR /app

COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod --frozen-lockfile

COPY --chown=node:node . /app
RUN pnpm install --offline --prod
RUN pnpm puppeteer browsers install chrome
CMD ["node", "index.js"]