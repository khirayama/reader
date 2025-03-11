FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install essential build dependencies
RUN apk add --no-cache openssl postgresql-client make g++ python3

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Development image, copy all the files and run next
FROM base AS development
WORKDIR /app

# Install only essential dependencies
RUN apk add --no-cache openssl postgresql-client

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install build dependencies only for rebuilding bcrypt
RUN apk add --no-cache --virtual .build-deps make g++ python3 \
    && npm rebuild bcrypt --build-from-source \
    && apk del .build-deps

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
# ENV NEXT_TELEMETRY_DISABLED 1

EXPOSE 3000

CMD ["npm", "run", "dev"]